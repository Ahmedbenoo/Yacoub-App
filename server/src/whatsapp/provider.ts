import { MetaCloudApiProvider } from './meta-cloud-provider.js';
import type { WhatsAppProvider, WhatsAppProviderKind, WhatsAppRuntimeStatus } from './types.js';
import { WhatsAppWebProvider } from './web-provider.js';

function providerKind(): WhatsAppProviderKind {
  return process.env.WHATSAPP_PROVIDER === 'web' ? 'web' : 'meta';
}

let instance: WhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (instance) return instance;
  instance = providerKind() === 'web' ? new WhatsAppWebProvider() : new MetaCloudApiProvider();
  return instance;
}

export async function startWhatsAppProvider(): Promise<void> {
  const provider = getWhatsAppProvider();
  await provider.start();
  console.log(`WhatsApp provider: ${provider.kind}`);
}

export function getWhatsAppRuntimeStatus(): WhatsAppRuntimeStatus {
  return getWhatsAppProvider().status();
}

export async function sendAppWhatsApp(body: string, to: string): Promise<boolean> {
  return getWhatsAppProvider().sendText(to, body);
}
