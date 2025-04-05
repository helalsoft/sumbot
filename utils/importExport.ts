import { browser } from "wxt/browser";
import { STORAGE_KEYS, setStorageItemSafe, getStorageItemSafe } from "./storage";
import { i18n } from "#i18n";

export type ExportedSettings = {
  version: string;
  timestamp: number;
  data: {
    [key in STORAGE_KEYS]?: any;
  };
};

/**
 * Exports all extension settings to a JSON file
 */
export async function exportSettings(): Promise<void> {
  try {
    const exportData: ExportedSettings = {
      version: browser.runtime.getManifest().version,
      timestamp: Date.now(),
      data: {},
    };

    // Get all storage items
    for (const key of Object.values(STORAGE_KEYS)) {
      exportData.data[key] = await getStorageItemSafe(key as STORAGE_KEYS);
    }

    // Create a blob from the data
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    // Create a download link and trigger it
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = i18n.t("exportFilename");
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error("Failed to export settings:", error);
  }
}

/**
 * Imports extension settings from a JSON file
 * @param file The file to import settings from
 * @returns A promise that resolves when the import is complete
 */
export async function importSettings(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async event => {
      try {
        if (!event.target?.result) {
          reject(new Error("Failed to read file"));
          return;
        }

        const importedData = JSON.parse(event.target.result as string) as ExportedSettings;

        // Validate imported data structure
        if (!importedData.data || typeof importedData.data !== "object") {
          reject(new Error("Invalid import data structure"));
          return;
        }

        // Import each storage item
        for (const key of Object.values(STORAGE_KEYS)) {
          const typedKey = key as STORAGE_KEYS;
          if (importedData.data[typedKey] !== undefined) {
            await setStorageItemSafe(typedKey, importedData.data[typedKey]);
          }
        }

        resolve(true);
      } catch (error) {
        console.error("Failed to import settings:", error);
        reject(error);
      }
    };

    reader.onerror = error => {
      reject(error);
    };

    reader.readAsText(file);
  });
}
