# Background Script Documentation

The background script (`entrypoints/background.ts`) serves as the central controller for the SumBot extension. It manages browser icon state, handles user interactions, coordinates content extraction, and manages communication with AI models.

## Overview

The background script is implemented as a service worker that runs in the background and responds to various browser events. It's responsible for:

1. Handling browser action (toolbar icon) clicks
2. Managing context menus
3. Processing URL parameters
4. Coordinating content extraction and submission
5. Managing the extension's state across tabs

## Key Components

### Tab Processing Management

The script maintains a `processingTabs` Set to track which tabs are currently being processed. This prevents multiple simultaneous operations on the same tab.

```typescript
let processingTabs = new Set<number>();
```

### Icon State Management

The `setIconState` function manages the extension icon's appearance based on the current state:

```typescript
async function setIconState(state: IconStateType, tabId?: number): Promise<void>;
```

- **States**:

  - `default`: Normal state, icon is enabled
  - `processing`: Shows the processing icon and disables the browser action
  - `disabled`: Disables the browser action without changing the icon

- **Cross-browser Compatibility**: Uses `browser.action || browser.browserAction` to support both Chrome and Firefox

### Content Processing

The `processTab` function is the main workflow for handling browser action clicks:

```typescript
async function processTab(tab: chrome.tabs.Tab): Promise<void>;
```

1. Prevents duplicate processing of the same tab
2. Sets the icon to "processing" state
3. Extracts content based on the page type (YouTube or regular web page)
4. Determines the appropriate command to use
5. Generates a prompt using the command template
6. Selects the appropriate AI model
7. Submits the prompt to the selected model
8. Resets the icon state when complete

### URL Parameter Handling

The `handleUrlParameters` function detects and processes the `sumbot_prompt` URL parameter:

```typescript
async function handleUrlParameters(tab: { url?: string; id?: number }): Promise<void>;
```

1. Checks if the current tab is a supported AI model website
2. Looks for the `sumbot_prompt` parameter in the URL
3. Executes a content script to fill the model's input field with the prompt
4. Provides visual feedback via icon state changes

### Context Menu Management

The script dynamically creates and manages context menus based on user-defined commands:

```typescript
async function createDynamicContextMenus(): Promise<void>;
```

- Creates parent menus for different contexts:

  - Selection context (for selected text)
  - Page context (for regular web pages)
  - YouTube context (only visible on YouTube)

- Populates each menu with appropriate commands based on:
  - Command context (page, YouTube, or both)
  - Command properties (e.g., excludes commands with HTML variables from selection context)

### Context Menu Click Handling

The `handleContextMenuClick` function processes user interactions with context menu items:

```typescript
async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
): Promise<void>;
```

1. Determines the command and context from the clicked menu item
2. Extracts content based on the context:
   - Selected text for selection context
   - YouTube transcript for YouTube context
   - Page content for page context
3. Generates a prompt using the selected command
4. Submits the prompt to the appropriate model
5. Updates command usage timestamps

### Command Selection

The `getCommandKey` function determines which command to use based on the content type:

```typescript
async function getCommandKey(data: Partial<ExtractedContent>): Promise<string>;
```

- Returns the default YouTube command for YouTube content
- Returns the default page command for regular web pages

## Event Listeners

The background script sets up several event listeners:

### Browser Action Click

```typescript
browserAction.onClicked.addListener((tab: any) => processTab(tab));
```

Triggers the content processing workflow when the extension icon is clicked.

### Extension Installation

```typescript
browser.runtime.onInstalled.addListener(() => {
  createDynamicContextMenus();
});
```

Creates the initial context menus when the extension is installed or updated.

### Storage Changes

```typescript
browser.storage.onChanged.addListener(changes => {
  if (changes[STORAGE_KEYS.USER_GENERATED_COMMANDS]) {
    createDynamicContextMenus();
  }
});
```

Recreates context menus when user-defined commands are modified.

### Context Menu Clicks

```typescript
browser.contextMenus.onClicked.addListener((info: any, tab?: any) =>
  handleContextMenuClick(info, tab)
);
```

Handles user interactions with context menu items.

### Tab Activation

```typescript
browser.tabs.onActivated.addListener(async activeInfo => {
  // ...
});
```

Updates the icon state when the user switches tabs.

### Tab Updates

```typescript
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // ...
});
```

- Checks for URL parameters when a page finishes loading
- Updates the icon state based on the current URL

## Cross-browser Compatibility

The background script includes several features to ensure compatibility across browsers:

1. Uses `browser.action || browser.browserAction` to support both Chrome and Firefox
2. Includes conditional checks for browser-specific APIs (e.g., `if (browserAction.disable)`)
3. Uses type assertions to handle type compatibility issues between browser APIs

## Error Handling

The script implements comprehensive error handling:

1. Each major function is wrapped in try-catch blocks
2. Errors are logged to the console for debugging
3. The icon state is reset to default when errors occur
4. The `processingTabs` set is properly maintained even when errors occur

## Performance Considerations

1. Uses `Promise.all` for parallel operations when possible
2. Prevents duplicate processing of the same tab
3. Implements debouncing for tab update events
4. Efficiently manages context menu creation to minimize overhead

## Security Considerations

1. Validates all user input and storage data
2. Uses safe storage access methods
3. Implements proper error handling to prevent extension crashes
4. Avoids executing arbitrary code

## Debugging

The script includes extensive logging to aid in debugging:

```typescript
console.log("Extension clicked - starting process");
console.log("Starting content extraction");
console.log("Submitting content to promptSubmitter");
// ...
```

These logs can be viewed in the browser's developer tools when inspecting the extension's background page.
