import { defineExtensionMessaging } from "@webext-core/messaging";

interface ProtocolMap {
  toggleProcessingUI(isProcessing: boolean): void;
  showAlert(message: string): void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
