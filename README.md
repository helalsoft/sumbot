# SumBot

<p align="center">
  <img src="./icon/Chrome Web Store.png" alt="SumBot Logo" width="128" height="128">
<p align="center">
  <a href="https://chromewebstore.google.com/detail/sumbot/jcanihploedckhhpcoelciemdjamkajf" target="_blank">Chrome Web Store</a>
</p>
</p>

SumBot is a browser extension that helps users get summaries of web page content using chat models. It extracts content from web pages or YouTube transcripts and sends it to your preferred chat model for summarization.

## Features

- **Content Summarization**: Summarize any web page or YouTube video transcript with a single click
- **Multiple Chat Models**: Support for various chat models including ChatGPT, Perplexity, Grok, Gemini, Claude, and DeepSeek
- **Custom Commands**: Create and manage custom summarization commands with variables
- **Context Menu Integration**: Right-click to summarize selected text or entire pages
- **URL Parameter Auto-filling**: Automatically fill model inputs using the `sumbot_prompt` URL parameter
- **Multi-browser Support**: Works with Chrome and Firefox
- **Internationalization**: Supports English and Turkish languages
- **Settings Import/Export**: Backup and share your custom configurations

## Installation

### From Source

1. Clone this repository:

   ```bash
   git clone https://github.com/helalsoft/sumbot.git
   cd sumbot
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build the extension:

   ```bash
   # For Chrome
   pnpm build

   # For Firefox
   pnpm build:firefox
   ```

4. Load the extension:
   - **Chrome**: Go to `chrome://extensions/`, enable Developer mode, and click "Load unpacked". Select the `dist/` directory.
   - **Firefox**: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select any file in the `dist/` directory.

### From Release

1. Download the latest release from the [Releases](https://github.com/yourusername/sumbot/releases) page
2. Install in your browser:
   - **Chrome**: Drag and drop the `.zip` file onto the `chrome://extensions/` page
   - **Firefox**: Go to `about:addons`, click the gear icon, select "Install Add-on From File", and select the `.xpi` file

## Usage

### Basic Usage

1. Navigate to any web page or YouTube video
2. Click the SumBot icon in your browser toolbar
3. The extension will extract the content and send it to your default chat model for summarization

### Context Menu

Right-click on any web page to access SumBot commands:

- Summarize the entire page
- Summarize selected text
- Use custom commands you've created

### Options Page

Access the options page by right-clicking the SumBot icon and selecting "Options" to:

- Set your default chat model
- Create and manage custom commands
- Define reusable variables for your commands
- Import/export your settings

### URL Parameter Auto-filling

SumBot supports automatic input filling using URL parameters:

1. Navigate to any supported AI model website with the `sumbot_prompt` parameter:

   ```
   https://chat.openai.com/?sumbot_prompt=Explain quantum computing in simple terms
   ```

2. The extension automatically detects the parameter and fills the input field

3. Start interacting with the AI model immediately

This feature is useful for:

- Creating bookmarks with pre-filled prompts
- Sharing links with specific prompts
- Integrating with other tools and workflows

## Browser Permissions

The extension requires several permissions to function properly:

- `activeTab`: For accessing the current tab's content
- `webNavigation`: For detecting page navigation
- `scripting`: For content script injection
- `contextMenus`: For right-click menu integration
- `storage`: For persistent data storage
- `<all_urls>`: For accessing page content across different domains

## Development

### Technology Stack

- **Framework**: Built with [WXT](https://wxt.dev/) (Web Extension Tools)
- **UI**: React with Tailwind CSS for styling
- **Language**: TypeScript
- **Package Manager**: pnpm

### Commands

```bash
# Development mode
pnpm dev          # Chrome
pnpm dev:firefox  # Firefox

# Build
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

### Documentation

Additional documentation for developers can be found in the `docs/developer/` directory:

- [Project Overview](docs/developer/project-overview.md)
- [Background Script](docs/developer/background.md)
- [Storage Implementation](docs/developer/storage.md)
- [Internationalization](docs/developer/i18n.md)
- [Import/Export Functionality](docs/developer/importExport.md)
- [Messaging System](docs/developer/messaging.md)

## License

[CC BY-NC 4.0](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
