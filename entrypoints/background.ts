import { models, iconPaths, type IconStateType, type Context, type ModelDetails } from "@/config";

// Helper to handle both action and browserAction APIs
const browserAction = browser.action || browser.browserAction;
import { ExtractedContent, extractText, extractYoutubeTranscript } from "@/utils/extractors";
import { generatePrompt } from "@/utils/promptGenerator";
import { submitPrompt, submitPromptToTextarea } from "@/utils/promptSubmitter";
import { selectModel } from "@/utils/modelSelector";
import { sendMessage } from "@/utils/messaging";
import { isYouTube, getUrlParameter } from "@/utils/url";
import { STORAGE_KEYS, getStorageItemSafe } from "@/utils/storage";
import { i18n } from "#i18n";

let processingTabs = new Set<number>();

async function setIconState(state: IconStateType, tabId?: number): Promise<void> {
  try {
    console.log(`Setting icon to ${state} state`);

    if (tabId && tabId > -1) {
      await browserAction.setIcon({ path: iconPaths[state] });

      switch (state) {
        case "processing":
          processingTabs.add(tabId);
          if (browserAction.disable) {
            await browserAction.disable(tabId);
          }
          break;
        case "disabled":
          if (browserAction.disable) {
            await browserAction.disable(tabId);
          }
          break;
        default:
          processingTabs.delete(tabId);
          if (browserAction.enable) {
            await browserAction.enable(tabId);
          }
          break;
      }

      // Notify content scripts about processing state
      await sendMessage("toggleProcessingUI", state === "processing", tabId && { tabId });
    }
  } catch (error) {
    console.error("Error setting icon state:", error);
    throw error;
  }
}

async function processTab(tab: chrome.tabs.Tab): Promise<void> {
  // Prevent processing if the tab is already being processed
  if (processingTabs.has(tab.id!)) {
    console.log("Tab is already being processed, ignoring click");
    return;
  }

  console.log("Extension clicked - starting process");

  try {
    processingTabs.add(tab.id!);
    await setIconState("processing", tab.id);
    console.log("Starting content extraction");

    // Check if the URL is from YouTube using the shared utility function
    const data = isYouTube(tab.url) ? await extractYoutubeTranscript() : await extractText();

    if (data.content.length === 0) {
      sendMessage("showAlert", i18n.t("noContentExtracted"), tab.id && { tabId: tab.id });
      throw new Error("No content extracted");
    }

    console.log("Submitting content to promptSubmitter");
    const commandKey = await getCommandKey(data);
    const promptText = await generatePrompt(data, commandKey);
    const userCommands = await getStorageItemSafe(STORAGE_KEYS.USER_GENERATED_COMMANDS);
    const overrideModel = userCommands[commandKey]?.model;

    // Select the appropriate model based on text, command conditions, and override
    const { model } = await selectModel(promptText, commandKey, overrideModel);

    await Promise.all([submitPrompt(promptText, model), setIconState("default", tab.id)]);
  } catch (error) {
    console.log("Error occurred during processing");
    await setIconState("default", tab.id);
    console.error("Error details:", error);
    throw error;
  } finally {
    processingTabs.delete(tab.id!);
  }
}

// Helper function to check if the URL matches any of the models
function isMatchingUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    return Object.values(models).some(model => {
      const modelUrl = new URL(model.url);
      const currentUrl = new URL(url);
      return (
        currentUrl.origin === modelUrl.origin && currentUrl.pathname.startsWith(modelUrl.pathname)
      );
    });
  } catch {
    return false;
  }
}

/**
 * Gets the model details for a given URL if it matches any model
 * @param url The URL to check
 * @returns The model details or null if no match
 */
function getMatchingModel(url: string | undefined): ModelDetails | null {
  if (!url) return null;
  try {
    for (const [, modelDetails] of Object.entries(models)) {
      const modelUrl = new URL(modelDetails.url);
      const currentUrl = new URL(url);
      if (
        currentUrl.origin === modelUrl.origin &&
        currentUrl.pathname.startsWith(modelUrl.pathname)
      ) {
        return modelDetails;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Handles URL parameters for model websites
 * @param tab The tab to check for parameters
 */
async function handleUrlParameters(tab: { url?: string; id?: number }): Promise<void> {
  if (!tab.url || !tab.id) return;

  // Check if this is a model website
  const matchingModel = getMatchingModel(tab.url);
  if (!matchingModel) return;

  // Check for sumbot_prompt parameter
  const promptParam = getUrlParameter(tab.url, "sumbot_prompt");
  if (!promptParam) return;

  // Prevent processing if the tab is already being processed
  if (processingTabs.has(tab.id)) {
    console.log("Tab is already being processed, ignoring URL parameter");
    return;
  }

  console.log("Found sumbot_prompt parameter, submitting text:", promptParam);

  try {
    processingTabs.add(tab.id);
    await setIconState("processing", tab.id);

    // Wait for the page to fully load
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Execute script to submit the prompt
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: submitPromptToTextarea,
      args: [promptParam, matchingModel],
    });

    // Clean up the URL by removing the parameter
    const cleanUrl = new URL(tab.url);
    cleanUrl.searchParams.delete("sumbot_prompt");
    // await browser.tabs.update(tab.id, { url: cleanUrl.toString() });
  } catch (error) {
    console.error("Error handling URL parameter:", error);
  } finally {
    await setIconState("default", tab.id);
    processingTabs.delete(tab.id);
  }
}

/**
 * Creates dynamic context menus based on commands from storage
 */
async function createDynamicContextMenus(): Promise<void> {
  try {
    // Clear existing context menus
    browser.contextMenus.removeAll();

    // Get user commands from storage
    const userCommands = await getStorageItemSafe(STORAGE_KEYS.USER_GENERATED_COMMANDS);

    // Create parent menu for selection context
    browser.contextMenus.create({
      id: "sumbot-selection",
      title: i18n.t("textCommandsMenuTitle"),
      contexts: ["selection"],
    });

    // Create parent menu for page context - exclude YouTube domains
    browser.contextMenus.create({
      id: "sumbot-page",
      title: i18n.t("textCommandsMenuTitle"),
      contexts: ["page"],
    });

    // Create parent menu for YouTube context (only visible on YouTube)
    browser.contextMenus.create({
      id: "sumbot-youtube",
      title: i18n.t("youtubeCommandsMenuTitle"),
      contexts: ["page"],
      documentUrlPatterns: ["*://*.youtube.com/*"],
    });

    // Create menu items for each command
    for (const [commandId, command] of Object.entries(userCommands)) {
      // Skip commands without names or prompts
      if (!command.name || !command.prompt) continue;

      // For selected text context - only show page commands and exclude commands with HTML or fullPageContent variables
      if (
        command.context === "page" &&
        !["{{html}}", "{{fullPageContent}}"].some(variable => command.prompt.includes(variable))
      ) {
        browser.contextMenus.create({
          id: `selection-${commandId}`,
          title: command.name,
          parentId: "sumbot-selection",
          contexts: ["selection"],
        });
      }

      // Handle commands for regular pages
      if (!command.context || command.context === "page") {
        // Show page commands on the regular page context menu
        browser.contextMenus.create({
          id: `page-${commandId}`,
          title: command.name,
          parentId: "sumbot-page",
          contexts: ["page"],
        });
      }

      // Handle YouTube-specific commands and commands without a specific context
      if (command.context === "youtube" || !command.context) {
        // Show on YouTube pages
        browser.contextMenus.create({
          id: `youtube-${commandId}`,
          title: command.name,
          parentId: "sumbot-youtube",
          contexts: ["page"],
        });
      }
    }

    console.log("Dynamic context menus created successfully");
  } catch (error) {
    console.error("Error creating dynamic context menus:", error);
  }
}

/**
 * Handles context menu clicks and processes the selected command
 */
async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
): Promise<void> {
  try {
    if (!tab?.id) return;

    const menuId = info.menuItemId.toString();

    // Get command ID from menu ID
    let commandKey: string | null = null;
    // 'selection' is a special case not in Context type
    let context: "selection" | Context = "page";

    if (menuId.startsWith("selection-")) {
      commandKey = menuId.replace("selection-", "");
      context = "selection";
    } else if (menuId.startsWith("page-")) {
      commandKey = menuId.replace("page-", "");
      context = "page";
    } else if (menuId.startsWith("youtube-")) {
      commandKey = menuId.replace("youtube-", "");
      context = "youtube";
    }

    if (!commandKey) return;

    // Prevent processing if the tab is already being processed
    if (processingTabs.has(tab.id)) {
      console.log("Tab is already being processed, ignoring context menu click");
      return;
    }

    processingTabs.add(tab.id);
    await setIconState("processing", tab.id);

    try {
      let data;

      // Extract content based on context
      if (context === "selection" && info.selectionText) {
        // For selection, we only use the selected text - context is always page
        data = { title: tab.title, content: info.selectionText };
      } else if (context === "youtube" || (isYouTube(tab.url) && context === "page")) {
        data = await extractYoutubeTranscript();
      } else {
        data = await extractText();
      }

      if (data.content.length === 0) {
        sendMessage("showAlert", i18n.t("noContentExtracted"), tab.id && { tabId: tab.id });
        throw new Error("No content extracted");
      }

      // Generate prompt using the specific command
      const promptText = await generatePrompt(data, commandKey);

      // Get the model from commandId using storage api defined in storage.md
      const userCommands = await getStorageItemSafe(STORAGE_KEYS.USER_GENERATED_COMMANDS);
      const overrideModel = userCommands[commandKey]?.model;

      // Select the appropriate model based on text, command conditions, and override
      const { model } = await selectModel(promptText, commandKey, overrideModel);

      await submitPrompt(promptText, model);

      // Update command timestamp
      const timestamps = await getStorageItemSafe(STORAGE_KEYS.COMMAND_TIMESTAMPS);
      timestamps[commandKey] = Date.now();
      await browser.storage.local.set({
        [STORAGE_KEYS.COMMAND_TIMESTAMPS]: timestamps,
      });
    } catch (error) {
      console.error("Error processing context menu command:", error);
    } finally {
      await setIconState("default", tab.id);
      processingTabs.delete(tab.id);
    }
  } catch (error) {
    console.error("Error in context menu handler:", error);
  }
}

async function getCommandKey(data: Partial<ExtractedContent>): Promise<string> {
  const isYouTubeContent = isYouTube(data.url);

  if (isYouTubeContent) {
    return await getStorageItemSafe(STORAGE_KEYS.DEFAULT_YOUTUBE_COMMAND);
  } else {
    return await getStorageItemSafe(STORAGE_KEYS.DEFAULT_PAGE_COMMAND);
  }
}

export default defineBackground(() => {
  // Use type assertion to handle type compatibility issues
  browserAction.onClicked.addListener((tab: any) => processTab(tab));

  browser.runtime.onInstalled.addListener(() => {
    // Create dynamic context menus on installation
    createDynamicContextMenus();
  });

  // Listen for storage changes to update context menus when commands change
  browser.storage.onChanged.addListener(changes => {
    if (changes[STORAGE_KEYS.USER_GENERATED_COMMANDS]) {
      createDynamicContextMenus();
    }
  });

  // Handle context menu clicks
  // Use type assertion to handle type compatibility issues
  browser.contextMenus.onClicked.addListener((info: any, tab?: any) =>
    handleContextMenuClick(info, tab)
  );

  // Add listener for tab changes
  browser.tabs.onActivated.addListener(async activeInfo => {
    const tabId = activeInfo.tabId;
    try {
      const tab = await browser.tabs.get(tabId);
      if (isMatchingUrl(tab.url)) {
        if (browserAction.disable) {
          await browserAction.disable(tabId);
        }
      } else {
        if (browserAction.enable) {
          await browserAction.enable(tabId);
        }
      }
    } catch (error) {
      console.error("Error getting tab:", error);
    }
  });

  // Add listener for tab changes
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Check if the tab has completed loading
    if (changeInfo.status === "complete") {
      // Check for URL parameters on model websites
      await handleUrlParameters(tab);
    }

    // Handle icon state based on URL
    if (isMatchingUrl(tab.url)) {
      if (browserAction.disable) {
        await browserAction.disable(tabId);
      }
    } else {
      if (browserAction.enable) {
        await browserAction.enable(tabId);
      }
    }
  });
});
