import { ExtractedContent } from ".";

export async function extractText(): Promise<ExtractedContent> {
  // Get the active tab
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  // Set processing title.
  const originalTitle = tab.title;
  tab.title = i18n.t("processing");

  if (!tab?.id) {
    throw new Error("No active tab found");
  }

  // Execute content script to extract the page content
  const result = await browser.scripting.executeScript({
    target: { tabId: tab.id },
    func: getTextFromDoc,
  });

  // Type assertion to help TypeScript understand the result structure
  // This is necessary because browser.scripting.executeScript doesn't preserve the return type of the function
  const scriptResult = result[0]?.result as GetTextFromDocResult | undefined;

  if (!scriptResult) {
    throw new Error("Failed to extract content");
  }

  // Set title back to normal.
  tab.title = originalTitle;

  return {
    title: tab.title,
    ...scriptResult, // Now TypeScript knows this has content and rawHtml properties
    timestamp: new Date().toISOString(),
    url: tab.url || "",
  };
}

// Define the return type of the getTextFromDoc function
type GetTextFromDocResult = {
  content: string;
  rawHtml: string;
  fullPageContent?: string;
};

function getTextFromDoc(): GetTextFromDocResult {
  // Get the main content
  // First try to find article or main content areas
  const mainSelectors = [
    "main",
    "article",
    "[role='main']",
    ".main-content",
    "#main-content",
    ".post-main",
  ];

  let content = "";

  // Try to find main content using selectors
  for (const selector of mainSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      content = element.textContent || "";
      break;
    }
  }

  // If no main content found, fall back to body text
  if (!content) {
    // Remove common non-content elements
    const elementsToRemove = [
      "header",
      "footer",
      "nav",
      "aside",
      "script",
      "style",
      "noscript",
      "iframe",
      "svg",
    ];

    // Clone body to avoid modifying the actual page
    const bodyClone = document.body.cloneNode(true) as HTMLElement;

    // Remove unwanted elements from clone
    elementsToRemove.forEach(selector => {
      bodyClone.querySelectorAll(selector).forEach(el => el.remove());
    });

    content = bodyClone.textContent || "";
  }

  // Clean up the content
  content = content
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing whitespace

  // Get the visible HTML content
  const visibleHtmlClone = document.body.cloneNode(true) as HTMLElement;

  // Remove non-visible elements
  const invisibleElementSelectors = [
    "script",
    "style",
    "noscript",
    "meta",
    "link",
    "template",
    "iframe",
    '[style*="display: none"]',
    '[style*="display:none"]',
    '[style*="visibility: hidden"]',
    '[style*="visibility:hidden"]',
    "[hidden]",
    "head",
  ];

  invisibleElementSelectors.forEach(selector => {
    visibleHtmlClone.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Remove comments
  const removeComments = (node: Node): void => {
    const childNodes = node.childNodes;
    for (let i = childNodes.length - 1; i >= 0; i--) {
      const child = childNodes[i];
      if (child.nodeType === 8) {
        // Comment node
        node.removeChild(child);
      } else if (child.nodeType === 1) {
        // Element node
        removeComments(child);
      }
    }
  };

  removeComments(visibleHtmlClone);

  // Get the HTML of the visible content
  const rawHtml = visibleHtmlClone.outerHTML;

  // Get the full page content (title + all visible text)
  const fullPageContent = `Title: ${document.title}\n\nContent:\n${visibleHtmlClone.textContent?.replace(/\s+/g, " ").trim() || ""}`;

  return {
    content,
    rawHtml,
    fullPageContent,
  };
}
