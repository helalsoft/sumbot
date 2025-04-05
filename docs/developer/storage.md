# Storage System Documentation

## Overview

SumBot uses [@webext-core/storage](https://github.com/webext-core/storage) for persistent storage management in the extension. This package provides a type-safe and promise-based wrapper around the browser's storage API.

## Storage Keys

All storage keys are defined in the `STORAGE_KEYS` enum in `utils/storage.ts`:

```typescript
export enum STORAGE_KEYS {
  DEFAULT_MODEL = "0",
  USER_GENERATED_COMMANDS = "1",
  USER_GENERATED_VARIABLES = "2",
  COMMAND_TIMESTAMPS = "3",
  DEFAULT_PAGE_COMMAND = "4",
  DEFAULT_YOUTUBE_COMMAND = "5",
}
```

## Type Safety and Schema

The storage schema is defined using TypeScript to ensure type safety:

```typescript
export type ExtensionStorageSchema = {
  [STORAGE_KEYS.DEFAULT_MODEL]: ModelName;
  [STORAGE_KEYS.USER_GENERATED_COMMANDS]: CommandList;
  [STORAGE_KEYS.USER_GENERATED_VARIABLES]: VariableList;
  [STORAGE_KEYS.COMMAND_TIMESTAMPS]: Record<string, number>;
  [STORAGE_KEYS.DEFAULT_PAGE_COMMAND]: string;
  [STORAGE_KEYS.DEFAULT_YOUTUBE_COMMAND]: string;
};
```

## Validation and Reset Strategy

SumBot implements a robust validation and reset strategy to handle corrupted or invalid data in storage. When invalid data is detected, the system will automatically reset all storage values to defaults and reload the page to provide a clean state.

### Core Components

1. **Type Validators**: Each storage key has a dedicated validator function to check data against expected types.
2. **Safe Storage Access**: Helper functions wrap the storage operations with validation.
3. **Reset Mechanism**: When invalid data is detected, all storage is reset and the page reloads.

### Helper Functions

#### `validateStorageValue`

```typescript
function validateStorageValue<K extends STORAGE_KEYS>(key: K, value: unknown): boolean;
```

Validates a storage value against its expected type using type guards.

#### `getStorageItemSafe`

```typescript
async function getStorageItemSafe<K extends STORAGE_KEYS>(
  key: K
): Promise<ExtensionStorageSchema[K]>;
```

Safely retrieves an item from storage with validation. If the value is invalid, it triggers a full storage reset and page reload.

#### `setStorageItemSafe`

```typescript
async function setStorageItemSafe<K extends STORAGE_KEYS>(
  key: K,
  value: ExtensionStorageSchema[K]
): Promise<void>;
```

Safely sets an item in storage with validation. If attempting to set an invalid value, it triggers a full storage reset and page reload.

#### `resetStorageAndReload`

```typescript
async function resetStorageAndReload(): Promise<void>;
```

Resets all storage values to their defaults and reloads the current page to provide a clean state.

## Usage

### Reading from Storage

Always use the safe helper function to read values from storage:

```typescript
import { STORAGE_KEYS, getStorageItemSafe } from "@/utils/storage";

// Safe reading with validation and reset if invalid
const modelKey = await getStorageItemSafe(STORAGE_KEYS.DEFAULT_MODEL);
```

### Writing to Storage

Always use the safe helper function to write values to storage:

```typescript
import { STORAGE_KEYS, setStorageItemSafe } from "@/utils/storage";

// Safe writing with validation and reset if invalid
await setStorageItemSafe(STORAGE_KEYS.DEFAULT_MODEL, "ChatGPT");
```

### Error Handling

The safe storage functions handle errors internally by resetting storage and reloading the page. However, you can still use try-catch for logging or fallback behavior:

```typescript
try {
  const modelKey = await getStorageItemSafe(STORAGE_KEYS.DEFAULT_MODEL);
  // Use the value
} catch (error) {
  console.error("Storage operation failed:", error);
  // The page will be reloaded automatically if the error was due to invalid data
}
```

## Current Storage Usage

### Model Selection

- **Key**: `STORAGE_KEYS.DEFAULT_MODEL`
- **Type**: `ModelName`
- **Default**: Defined in `DEFAULT_MODEL` from `config.ts`
- **Purpose**: Stores the user's selected AI model preference

### User-Generated Commands

- **Key**: `STORAGE_KEYS.USER_GENERATED_COMMANDS`
- **Type**: `CommandList`
- **Default**: `DEFAULT_COMMANDS` from `config.ts`
- **Purpose**: Stores user-created prompt commands

### User-Generated Variables

- **Key**: `STORAGE_KEYS.USER_GENERATED_VARIABLES`
- **Type**: `VariableList`
- **Default**: `DEFAULT_VARIABLES` from `config.ts`
- **Purpose**: Stores user-defined variables used in prompts

### Command Timestamps

- **Key**: `STORAGE_KEYS.COMMAND_TIMESTAMPS`
- **Type**: `Record<string, number>`
- **Default**: `{}`
- **Purpose**: Stores timestamps for when commands were last used

### Default Page Command

- **Key**: `STORAGE_KEYS.DEFAULT_PAGE_COMMAND`
- **Type**: `string`
- **Default**: `"summarizeText"`
- **Purpose**: Stores the default command for regular web pages

### Default YouTube Command

- **Key**: `STORAGE_KEYS.DEFAULT_YOUTUBE_COMMAND`
- **Type**: `string`
- **Default**: `"summarizeTranscript"`
- **Purpose**: Stores the default command for YouTube pages

## Best Practices

1. **Always Use Safe Functions**: Use `getStorageItemSafe` and `setStorageItemSafe` instead of directly accessing `extensionStorage`
2. **Type Safety**: Let TypeScript ensure type correctness by leveraging the storage schema
3. **Default Values**: Defaults are automatically handled by the safe functions
4. **Reset Awareness**: Be aware that invalid data will cause storage reset and page reload
5. **Error Handling**: Add error handling for operations that can fail for reasons other than invalid data
