import { defineExtensionStorage } from "@webext-core/storage";
import { browser } from "wxt/browser";
import {
  type VariableList,
  type CommandList,
  type ModelName,
  DEFAULT_MODEL,
  DEFAULT_COMMANDS,
  DEFAULT_VARIABLES,
} from "@/config";

export enum STORAGE_KEYS {
  DEFAULT_MODEL = "0",
  USER_GENERATED_COMMANDS = "1",
  USER_GENERATED_VARIABLES = "2",
  COMMAND_TIMESTAMPS = "3",
  DEFAULT_PAGE_COMMAND = "4",
  DEFAULT_YOUTUBE_COMMAND = "5",
}

export type ExtensionStorageSchema = {
  [STORAGE_KEYS.DEFAULT_MODEL]: ModelName;
  [STORAGE_KEYS.USER_GENERATED_COMMANDS]: CommandList;
  [STORAGE_KEYS.USER_GENERATED_VARIABLES]: VariableList;
  [STORAGE_KEYS.COMMAND_TIMESTAMPS]: Record<string, number>;
  [STORAGE_KEYS.DEFAULT_PAGE_COMMAND]: string;
  [STORAGE_KEYS.DEFAULT_YOUTUBE_COMMAND]: string;
};

export const extensionStorage = defineExtensionStorage<ExtensionStorageSchema>(
  browser.storage.local
);

// Default values for each storage key
const DEFAULT_VALUES: Record<STORAGE_KEYS, unknown> = {
  [STORAGE_KEYS.DEFAULT_MODEL]: DEFAULT_MODEL,
  [STORAGE_KEYS.USER_GENERATED_COMMANDS]: DEFAULT_COMMANDS,
  [STORAGE_KEYS.USER_GENERATED_VARIABLES]: DEFAULT_VARIABLES,
  [STORAGE_KEYS.COMMAND_TIMESTAMPS]: {},
  [STORAGE_KEYS.DEFAULT_PAGE_COMMAND]: "summarizeText",
  [STORAGE_KEYS.DEFAULT_YOUTUBE_COMMAND]: "summarizeTranscript",
};

/**
 * Type validators for storage values
 */
const validators = {
  [STORAGE_KEYS.DEFAULT_MODEL]: (value: unknown): value is ModelName => typeof value === "string",

  [STORAGE_KEYS.USER_GENERATED_COMMANDS]: (value: unknown): value is CommandList =>
    typeof value === "object" && value !== null,

  [STORAGE_KEYS.USER_GENERATED_VARIABLES]: (value: unknown): value is VariableList =>
    typeof value === "object" && value !== null,

  [STORAGE_KEYS.COMMAND_TIMESTAMPS]: (value: unknown): value is Record<string, number> =>
    typeof value === "object" && value !== null,

  [STORAGE_KEYS.DEFAULT_PAGE_COMMAND]: (value: unknown): value is string =>
    typeof value === "string",

  [STORAGE_KEYS.DEFAULT_YOUTUBE_COMMAND]: (value: unknown): value is string =>
    typeof value === "string",
};

/**
 * Resets the entire extension storage to default values and reloads the page
 */
export async function resetStorageAndReload(): Promise<void> {
  try {
    console.warn("Resetting extension storage to defaults due to invalid data");

    // Reset all storage values to defaults with proper type assertions
    await extensionStorage.setItem(
      STORAGE_KEYS.DEFAULT_MODEL,
      DEFAULT_VALUES[STORAGE_KEYS.DEFAULT_MODEL] as ModelName
    );
    await extensionStorage.setItem(
      STORAGE_KEYS.USER_GENERATED_COMMANDS,
      DEFAULT_VALUES[STORAGE_KEYS.USER_GENERATED_COMMANDS] as CommandList
    );
    await extensionStorage.setItem(
      STORAGE_KEYS.USER_GENERATED_VARIABLES,
      DEFAULT_VALUES[STORAGE_KEYS.USER_GENERATED_VARIABLES] as VariableList
    );
    await extensionStorage.setItem(
      STORAGE_KEYS.COMMAND_TIMESTAMPS,
      DEFAULT_VALUES[STORAGE_KEYS.COMMAND_TIMESTAMPS] as Record<string, number>
    );
    await extensionStorage.setItem(
      STORAGE_KEYS.DEFAULT_PAGE_COMMAND,
      DEFAULT_VALUES[STORAGE_KEYS.DEFAULT_PAGE_COMMAND] as string
    );
    await extensionStorage.setItem(
      STORAGE_KEYS.DEFAULT_YOUTUBE_COMMAND,
      DEFAULT_VALUES[STORAGE_KEYS.DEFAULT_YOUTUBE_COMMAND] as string
    );

    // Reload the current page
    if (browser.tabs) {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        await browser.tabs.reload(tabs[0].id);
      } else {
        window.location.reload();
      }
    } else {
      window.location.reload();
    }
  } catch (error) {
    console.error("Failed to reset storage:", error);
    window.location.reload();
  }
}

/**
 * Validates a storage value against its expected type
 * @param key Storage key
 * @param value Value to validate
 * @returns true if valid, false otherwise
 */
export function validateStorageValue<K extends STORAGE_KEYS>(key: K, value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  return validators[key](value);
}

/**
 * Wraps extensionStorage.getItem with validation,
 * resets storage and reloads page if value is invalid
 */
export async function getStorageItemSafe<K extends STORAGE_KEYS>(
  key: K
): Promise<ExtensionStorageSchema[K]> {
  try {
    const value = await extensionStorage.getItem(key);

    if (!validateStorageValue(key, value)) {
      console.error(`Invalid value in storage for key ${key}, resetting storage`);
      await resetStorageAndReload();
      // This line might not execute if page reloads, but needed for TypeScript
      return DEFAULT_VALUES[key] as ExtensionStorageSchema[K];
    }

    return value as ExtensionStorageSchema[K];
  } catch (error) {
    console.error(`Error retrieving storage item ${key}:`, error);
    await resetStorageAndReload();
    // This line might not execute if page reloads, but needed for TypeScript
    return DEFAULT_VALUES[key] as ExtensionStorageSchema[K];
  }
}

/**
 * Wraps extensionStorage.setItem with validation,
 * resets storage and reloads page if trying to set invalid value
 */
export async function setStorageItemSafe<K extends STORAGE_KEYS>(
  key: K,
  value: ExtensionStorageSchema[K]
): Promise<void> {
  try {
    if (!validateStorageValue(key, value)) {
      console.error(`Attempted to set invalid value for ${key}, resetting storage`);
      await resetStorageAndReload();
      return;
    }

    await extensionStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error setting storage item ${key}:`, error);
    await resetStorageAndReload();
  }
}
