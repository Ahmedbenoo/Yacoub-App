export type WhatsAppProviderKind = 'web' | 'meta';

export type WhatsAppConnectionState = 'connected' | 'disconnected';

export type WhatsAppRuntimeStatus = {
  provider: WhatsAppProviderKind;
  state: WhatsAppConnectionState;
  ready: boolean;
};

export interface WhatsAppProvider {
  readonly kind: WhatsAppProviderKind;
  start(): Promise<void>;
  status(): WhatsAppRuntimeStatus;
  sendText(to: string, body: string): Promise<boolean>;
}
