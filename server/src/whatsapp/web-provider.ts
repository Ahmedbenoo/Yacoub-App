import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { egyptInternationalDigits, isOtpDestinationAllowed, otpAllowlist } from './phone.js';
import type { WhatsAppProvider, WhatsAppRuntimeStatus } from './types.js';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const sessionDir = path.resolve(here, '..', '..', '.wwebjs_auth');

function chromePath(): string | undefined {
  const fromEnv = (process.env.WHATSAPP_WEB_CHROME_PATH || '').trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const candidates = [
    path.join(process.env.LOCALAPPDATA ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  return candidates.find((item) => existsSync(item));
}

function chromeVersion(executablePath: string | undefined): string {
  if (!executablePath) return 'bundled-puppeteer';
  try {
    return execFileSync(
      'powershell.exe',
      ['-NoProfile', '-Command', `(Get-Item -LiteralPath '${executablePath.replace(/'/g, "''")}').VersionInfo.ProductVersion`],
      { encoding: 'utf8' },
    ).trim();
  } catch {
    return 'unknown';
  }
}

function packageVersion(name: string): string {
  try {
    return String((require(`${name}/package.json`) as { version: string }).version);
  } catch {
    return 'unknown';
  }
}

type PageLike = {
  url: () => string;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  evaluate: <T>(fn: () => T) => Promise<T>;
};

type WebClient = {
  initialize: () => Promise<void>;
  sendMessage: (chatId: string, content: string) => Promise<unknown>;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  pupPage?: PageLike;
};

function logStage(stage: string, detail?: unknown): void {
  if (detail === undefined) {
    console.log(`WhatsApp Web [${stage}]`);
    return;
  }
  console.log(`WhatsApp Web [${stage}]`, detail);
}

function attachClientEvents(
  client: WebClient,
  qrcode: { generate: (qr: string, options?: { small?: boolean }) => void },
  onReady: () => void,
  onNotReady: () => void,
): void {
  client.on('loading_screen', (percent, message) => {
    logStage('loading_screen', `${String(percent)} ${String(message)}`);
  });
  client.on('qr', (qr) => {
    onNotReady();
    logStage('qr', 'code received — print terminal QR');
    console.log('WhatsApp Web: scan this QR with the sender phone (Linked devices).');
    qrcode.generate(String(qr), { small: true });
  });
  client.on('authenticated', () => {
    logStage('authenticated');
  });
  client.on('auth_failure', (message) => {
    onNotReady();
    console.error('WhatsApp Web [auth_failure]', message ? String(message) : '');
  });
  client.on('ready', () => {
    logStage('ready');
    onReady();
  });
  client.on('disconnected', (reason) => {
    onNotReady();
    logStage('disconnected', reason ? String(reason) : '');
  });
  client.on('change_state', (state) => {
    logStage('change_state', String(state));
  });
}

function attachPageDiagnostics(client: WebClient): () => void {
  let hooked = false;
  const failed = new Map<string, number>();
  const started = Date.now();

  const hookPage = (page: PageLike) => {
    if (hooked) return;
    hooked = true;
    logStage('browser_page', page.url() || 'about:blank');
    page.on('console', (msg) => {
      const item = msg as { type?: () => string; text?: () => string };
      const type = item.type?.() ?? 'log';
      const text = item.text?.() ?? '';
      if (type === 'error' || type === 'warning') console.error(`WhatsApp Web console.${type}:`, text.slice(0, 400));
    });
    page.on('pageerror', (error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error('WhatsApp Web pageerror:', message);
    });
    page.on('requestfailed', (request) => {
      const req = request as { url?: () => string; failure?: () => { errorText?: string } | null };
      const url = req.url?.() ?? '';
      if (!url.includes('whatsapp') && !url.includes('fbcdn') && !url.includes('facebook')) return;
      const reason = req.failure?.()?.errorText ?? 'failed';
      const key = `${reason} ${url.split('?')[0]}`;
      failed.set(key, (failed.get(key) ?? 0) + 1);
      if ((failed.get(key) ?? 0) <= 3) console.error('WhatsApp Web requestfailed:', reason, url.split('?')[0]);
    });
  };

  const timer = setInterval(() => {
    const page = client.pupPage;
    if (!page) {
      logStage('waiting_for_page', `${Math.round((Date.now() - started) / 1000)}s`);
      return;
    }
    hookPage(page);
    void page
      .evaluate(() => {
        const w = window as Window & {
          require?: (name: string) => { Socket?: { state?: string } };
          Debug?: { VERSION?: string };
        };
        const required = typeof w.require === 'function';
        let socketState: string | null = null;
        if (required) {
          try {
            socketState = w.require?.('WAWebSocketModel')?.Socket?.state ?? null;
          } catch {
            socketState = 'require_threw';
          }
        }
        return {
          href: location.href,
          title: document.title,
          debugVersion: w.Debug?.VERSION ?? null,
          hasRequire: required,
          socketState,
          platform: navigator.platform,
          ua: navigator.userAgent.slice(0, 80),
          cookies: document.cookie.slice(0, 160),
        };
      })
      .then((info) => {
        logStage('page', `${Math.round((Date.now() - started) / 1000)}s ${JSON.stringify(info)}`);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        logStage('page_poll_failed', message);
      });
  }, 4000);

  return () => clearInterval(timer);
}

export class WhatsAppWebProvider implements WhatsAppProvider {
  readonly kind = 'web' as const;
  private client: WebClient | null = null;
  private ready = false;
  private starting = false;
  private probed = false;

  async start(): Promise<void> {
    if (this.client || this.starting) return;
    this.starting = true;
    try {
      const qrcode = require('qrcode-terminal') as {
        generate: (qr: string, options?: { small?: boolean }) => void;
      };
      const wweb = require('whatsapp-web.js') as {
        Client: new (options: Record<string, unknown>) => WebClient;
        LocalAuth: new (options: { dataPath: string; clientId: string }) => unknown;
      };
      const executablePath = chromePath();
      const installedChrome = chromeVersion(executablePath);
      const linuxUserAgent = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${installedChrome || '155.0.0.0'} Safari/537.36`;
      logStage('versions', {
        node: process.version,
        library: packageVersion('whatsapp-web.js'),
        puppeteer: packageVersion('puppeteer'),
        chromePath: executablePath ?? 'puppeteer-bundled',
        chromeVersion: installedChrome,
        userAgent: linuxUserAgent,
        sessionDir,
        sessionExists: existsSync(path.join(sessionDir, 'session-otp')),
      });
      const client = new wweb.Client({
        authStrategy: new wweb.LocalAuth({ dataPath: sessionDir, clientId: 'otp-web' }),
        authTimeoutMs: 120000,
        userAgent: linuxUserAgent,
        evalOnNewDoc: () => {
          Object.defineProperty(navigator, 'platform', { get: () => 'Linux x86_64' });
          Object.defineProperty(navigator, 'userAgentData', { get: () => undefined });
          document.cookie = 'wa_build=w; path=/; max-age=31536000';
        },
        puppeteer: {
          headless: false,
          defaultViewport: null,
          executablePath,
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-features=UserAgentClientHint',
          ],
        },
      });
      attachClientEvents(
        client,
        qrcode,
        () => {
          this.ready = true;
          console.log('WhatsApp Web: Connected');
          if (process.env.WHATSAPP_SEND_PROBE === 'true') {
            void this.sendAllowlistProbe();
          }
        },
        () => {
          this.ready = false;
        },
      );
      this.client = client;
      const stopDiag = attachPageDiagnostics(client);
      logStage('initialize_start');
      void client
        .initialize()
        .then(() => {
          logStage('initialize_resolved');
        })
        .catch((error: unknown) => {
          this.ready = false;
          const message = error instanceof Error ? error.message : 'unknown error';
          console.error('WhatsApp Web: failed to start', message);
        })
        .finally(() => {
          setTimeout(stopDiag, 15_000);
        });
    } finally {
      this.starting = false;
    }
  }

  status(): WhatsAppRuntimeStatus {
    return {
      provider: this.kind,
      state: this.ready ? 'connected' : 'disconnected',
      ready: this.ready,
    };
  }

  private async sendAllowlistProbe(): Promise<void> {
    if (this.probed) return;
    this.probed = true;
    const to = otpAllowlist()[0];
    if (!to) {
      logStage('probe_skipped', 'empty allowlist');
      return;
    }
    const ok = await this.sendText(to, 'اختبار اتصال منجز طبي');
    logStage('allowlist_probe', ok ? `sent to ${to}` : `failed for ${to}`);
  }

  async sendText(to: string, body: string): Promise<boolean> {
    if (!this.client || !this.ready || !body.trim()) return false;
    if (!isOtpDestinationAllowed(to)) {
      console.log('WhatsApp Web: skipped send (number not on local allowlist)');
      return false;
    }
    const destination = egyptInternationalDigits(to);
    if (!destination) return false;
    try {
      await this.client.sendMessage(`${destination}@c.us`, body);
      console.log('WhatsApp Web: message sent');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      console.error('WhatsApp Web: send failed', message);
      return false;
    }
  }
}
