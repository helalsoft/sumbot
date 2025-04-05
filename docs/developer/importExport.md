# Import/Export Functionality

## Overview

SumBot provides functionality to export and import user settings in JSON format. This allows users to:

- Back up their settings
- Transfer settings between browsers or computers
- Share custom configurations with others

## Implementation

The import/export functionality is implemented in two main files:

1. **`utils/importExport.ts`**: Contains the core functions for exporting and importing settings
2. **`entrypoints/options/App.tsx`**: Contains the UI implementation with import/export buttons

## Export Format

Exported settings are saved in JSON format with the following structure:

```typescript
type ExportedSettings = {
  version: string; // Extension version
  timestamp: number; // Export timestamp
  data: {
    // Storage data
    [key in STORAGE_KEYS]?: any;
  };
};
```

## Security and Data Validation

When importing settings:

1. The JSON file is parsed and validated for proper structure
2. Each storage item is validated using the existing type validators
3. If invalid data is detected, the import operation will fail
4. Users are prompted with a confirmation dialog before proceeding with import

## Usage

### Exporting Settings

1. Navigate to the extension's options page
2. Click the "Export" button in the header
3. The settings will be downloaded as a JSON file

### Importing Settings

1. Navigate to the extension's options page
2. Click the "Import" button in the header
3. Select a previously exported JSON file
4. Confirm the import action in the dialog
5. The page will reload with the imported settings

## Error Handling

- If the import file has an invalid format, an error message will be displayed
- If the import is successful, a success message will be displayed and the page will reload
- All import/export operations are safely wrapped in try/catch blocks to prevent unhandled exceptions
