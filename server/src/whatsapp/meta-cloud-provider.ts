import { egyptInternationalDigits } from './phone.js';
import type { WhatsAppProvider, WhatsAppRuntimeStatus } from './types.js';

export class MetaCloudApiProvider implements WhatsAppProvider {
  readonly kind = 'meta' as const;

  async start(): Promise<void> {}

  status(): WhatsAppRuntimeStatus {
    const token = (process.env.WHATSAPP_TOKEN || '').trim();
    const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
    const ready = Boolean(token && phoneNumberId);
    return {
      provider: this.kind,
      state: ready ? 'connected' : 'disconnected',
      ready,
    };
  }

  async sendText(to: string, body: string): Promise<boolean> {
    const token = (process.env.WHATSAPP_TOKEN || '').trim();
    const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
    const destination = egyptInternationalDigits(to);
    if (!token || !phoneNumberId || !destination || !body.trim()) return false;
    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: destination,
        type: 'text',
        text: { body },
      }),
    }).catch(() => null);
    return Boolean(response?.ok);
  }
}
