# Browser Extension Messaging System

This document outlines how messaging works between different parts of our extension using `@webext-core/messaging`.

## Setup

The messaging system is configured in `utils/messaging.ts`:

```typescript
import { defineExtensionMessaging } from "@webext-core/messaging";

interface ProtocolMap {
  toggleProcessingUI(isProcessing: boolean): void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
```

## Usage

### Background Script (`background.ts`)

Messages can be sent to specific tabs by providing a `tabId`:

```typescript
// Send message to a specific tab
await sendMessage("toggleProcessingUI", isProcessing, tabId && { tabId });
```

Example from `setIconState`:

```typescript
async function setIconState(state: IconStateType, tabId?: number): Promise<void> {
  try {
    await chrome.action.setIcon({ path: iconPaths[state] });
    isProcessing = state === "processing";
    // Notify specific tab about processing state
    await sendMessage("toggleProcessingUI", isProcessing, tabId && { tabId });
  } catch (error) {
    console.error("Error setting icon state:", error);
    isProcessing = false;
    throw error;
  }
}
```

### Content Script (`content.tsx`)

Messages are received using the `onMessage` handler:

```typescript
onMessage("toggleProcessingUI", async message => {
  if (message.data) {
    ui.mount();
  } else {
    ui.remove();
  }
});
```

## Message Types

Currently implemented messages:

### `toggleProcessingUI`

- **Purpose**: Toggle the processing UI overlay in content scripts
- **Data**: Boolean indicating if processing is active
- **Direction**: Background → Content
- **Options**: Can target specific tab using `tabId`

## Best Practices

1. **Type Safety**: Always define message types in the `ProtocolMap` interface
2. **Tab Targeting**: Use `tabId` when sending messages to specific tabs
3. **Error Handling**: Wrap message handling in try-catch blocks
4. **UI State**: Use mount/remove for UI state management in content scripts

## Example Flow

1. User clicks extension icon
2. Background processes content:
   ```typescript
   await setIconState("processing", tab.id); // Shows UI
   // ... processing ...
   await setIconState("default", tab.id); // Hides UI
   ```
3. Content script receives message and updates UI accordingly
