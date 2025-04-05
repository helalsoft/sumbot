# SumBot Project Overview

SumBot is a browser extension that helps users get summaries of web page content using AI chat models. It extracts content from web pages or YouTube transcripts and sends it to the user's preferred chat model for summarization. The extension is built using modern web technologies and follows best practices for browser extension development.

## Architecture Overview

SumBot follows a modular architecture with clear separation of concerns:

1. **Content Extraction**: Specialized extractors for web pages and YouTube transcripts
2. **Prompt Generation**: Dynamic prompt creation with variable substitution
3. **Model Integration**: Support for multiple AI chat models with unified interface
4. **Storage Management**: Type-safe storage with validation
5. **UI Components**: React-based user interface with Tailwind CSS styling

## Project Structure

```
sumbot/
├── assets/           # Static assets and styles
├── components/       # Reusable UI components
├── docs/             # Project documentation
│   └── developer/    # Developer-focused documentation
├── entrypoints/      # Extension entry points
│   ├── background.ts # Background service worker
│   ├── content/      # Content scripts
│   └── options/      # Options page
├── icon/             # Extension icons in various sizes
├── locales/          # Internationalization files (en, tr)
├── public/           # Static files copied to output
├── utils/            # Shared utility functions
│   ├── extractors.ts # Content extraction utilities
│   ├── i18n.ts       # Internationalization setup
│   ├── importExport.ts # Settings import/export
│   ├── messaging.ts  # Inter-context communication
│   ├── modelSelector.ts # Model selection logic
│   ├── promptGenerator.ts # Prompt creation
│   ├── promptSubmitter.ts # Model interaction
│   ├── storage.ts    # Storage management
│   └── url.ts        # URL handling utilities
└── config.ts         # Central configuration
```

## Core Components

### Browser Action

SumBot uses a direct browser action without a popup UI:

- When the extension icon is clicked, it immediately processes the current page
- The background script handles the click event and initiates content extraction
- Visual feedback is provided by changing the icon state during processing
- No popup UI is displayed, making the summarization process faster and more direct

### Content Extraction

SumBot extracts content from web pages and YouTube videos using specialized extractors:

- **Web Page Extraction**: Extracts main content, title, and URL from regular web pages
- **YouTube Transcript Extraction**: Extracts video transcripts, title, and URL from YouTube videos

### Prompt Generation

The prompt generation system supports:

- Custom user-defined commands with variables
- Default commands for different contexts (page, YouTube, selected text)
- Variable substitution with default and user-defined variables

### Model Integration

SumBot supports multiple AI chat models including:

- ChatGPT
- Perplexity
- Gemini
- Claude
- Grok
- DeepSeek

Each model has specific integration code for submitting prompts and handling responses.

### URL Parameter Auto-filling

The extension detects and processes the `sumbot_prompt` URL parameter on supported model websites, automatically filling the input field with the provided text.

## Technology Stack

- **Framework**: Built with [WXT](https://wxt.dev/) (Web Extension Tools)
- **UI**: React with Tailwind CSS for styling
- **State Management**: React hooks and context
- **Storage**: Browser extension storage API with type-safe wrappers
- **Internationalization**: WXT i18n module with YAML-based translations
- **Language**: TypeScript
- **Package Manager**: pnpm

## Key Features

- **Content Summarization**: Summarize any web page or YouTube video transcript
- **Multiple Chat Models**: Support for various chat models with unified interface
- **Custom Commands**: Create and manage custom summarization commands with variables
- **Context Menu Integration**: Right-click to summarize selected text or entire pages
- **URL Parameter Auto-filling**: Automatically fill model inputs using URL parameters
- **Multi-browser Support**: Works with Chrome and Firefox
- **Internationalization**: Supports English and Turkish languages
- **Settings Import/Export**: Backup and share custom configurations

## Configuration Files

- `wxt.config.ts`: Main extension configuration (manifest, permissions, etc.)
- `web-ext.config.ts`: Web-ext specific configuration for browser testing
- `tsconfig.json`: TypeScript configuration
- `config.ts`: Application-specific configuration (models, commands, variables)

## Browser Permissions

The extension requires several permissions to function properly:

- `activeTab`: For accessing the current tab's content
- `webNavigation`: For detecting page navigation and URL parameters
- `scripting`: For content script injection and DOM manipulation
- `contextMenus`: For right-click menu integration
- `storage`: For persistent data storage
- `<all_urls>`: For accessing page content across different domains

## Development Workflow

```bash
# Development mode with hot reload
pnpm dev          # Chrome
pnpm dev:firefox  # Firefox

# Build for production
pnpm build          # Chrome
pnpm build:firefox  # Firefox

# Create distribution package
pnpm zip          # Chrome
pnpm zip:firefox  # Firefox

# Type checking
pnpm compile

# Format code
pnpm format
```

## Testing

The project uses manual testing for UI components and extension functionality. Future plans include adding automated tests for core utilities and components.

## Documentation

Additional documentation for developers can be found in the `docs/developer/` directory:

- [Background Script](background.md): Detailed documentation of the background service worker
- [Storage Implementation](storage.md): Details on the storage system
- [Internationalization](i18n.md): Guide to the i18n implementation
- [Import/Export Functionality](importExport.md): Settings backup and restore
- [Messaging System](messaging.md): Inter-context communication

## Project Status

SumBot is an active development project that aims to provide an efficient way to summarize web content using chat models. The project follows semantic versioning and maintains a changelog of significant updates.
