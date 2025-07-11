import { type ModelDetails } from "@/config";
import { browser } from "wxt/browser";

export async function submitPromptToTextarea(
  promptText: string,
  model: ModelDetails
): Promise<void> {
  console.log("Executing script in the tab");

  // Function to find element with indefinite retries
  const findElement = async <T extends Element>(
    selectors: string[],
    elementType: string,
    timeout = 500
  ): Promise<T> => {
    return new Promise(resolve => {
      const checkForElement = () => {
        for (const selector of selectors) {
          const element = document.querySelector<T>(selector);
          if (element) {
            console.log(`Found ${elementType} element after retrying:`, element);
            return resolve(element);
          }
        }
        console.log(`${elementType} element not found, retrying...`);
        setTimeout(checkForElement, timeout);
      };

      checkForElement();
    });
  };

  // Find input element with retries
  console.log("Searching for input element...");
  const inputEl = await findElement<HTMLElement>(model.input, "input");

  console.log("Found input element, setting value", inputEl);

  // Set value based on element type
  switch (true) {
    case inputEl instanceof HTMLTextAreaElement:
      console.log("Setting value for HTMLTextAreaElement");
      inputEl.value = promptText;
      break;
    case inputEl instanceof HTMLParagraphElement:
      console.log("Setting innerText for HTMLParagraphElement");
      inputEl.innerText = promptText;
      break;
    case inputEl instanceof HTMLDivElement:
      console.log("Simulating input for HTMLDivElement");
      inputEl.focus();
      document.execCommand("insertText", false, promptText);
      break;
    default:
      console.error("Unexpected element type:", inputEl);
      throw new Error("Unexpected element type");
  }

  // Dispatch input event to trigger any listeners
  const inputEvent = new Event("input", { bubbles: true });
  inputEl.dispatchEvent(inputEvent);

  console.log("Set input value and dispatched input event");

  // Wait for 1 second for UI changes
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Find button element with retries
  console.log("Searching for button element...");
  const buttonEl = await findElement<HTMLButtonElement>(model.button, "button");

  console.log("Found button element, clicking", buttonEl);
  buttonEl.click();

  // Wait for 1 second
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Clean input if model.cleanInput is true
  if (model.cleanInput) {
    const cleanInterval = setInterval(() => {
      switch (true) {
        case inputEl instanceof HTMLTextAreaElement && inputEl.value !== "":
          inputEl.value = "";
          break;
        case inputEl instanceof HTMLParagraphElement && inputEl.innerText !== "":
          inputEl.innerText = "";
          break;
        case !(inputEl instanceof HTMLTextAreaElement || inputEl instanceof HTMLParagraphElement):
          console.error("Unexpected element type:", inputEl);
          clearInterval(cleanInterval);
          throw new Error("Unexpected element type");
        default:
          clearInterval(cleanInterval);
      }
    }, 100);
  }
}

export async function submitPrompt(text: string, model: ModelDetails): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a new tab next to the current active tab
      const tabs = await browser.tabs.query({
        currentWindow: true,
        active: true,
      });
      const currentTab = tabs[0];
      const tab = await browser.tabs.create({
        url: model.url,
        index: currentTab.index + 1,
      });

      // Use a one-time event listener to prevent multiple executions
      const handleDOMContentLoaded = async (details: any) => {
        try {
          // Only proceed if this is the tab we created
          if (details.tabId !== tab.id) {
            return;
          }

          // Remove the listener right away to prevent it from firing again
          browser.webNavigation.onDOMContentLoaded.removeListener(handleDOMContentLoaded);

          console.log("DOM content loaded, waiting before executing script");

          // Wait for 1000 ms to ensure page is fully ready
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Execute script to submit the prompt to the textarea
          if (tab.id !== undefined) {
            await browser.scripting.executeScript({
              target: { tabId: tab.id },
              func: submitPromptToTextarea,
              args: [text, model],
            });
          } else {
            throw new Error("Tab ID is undefined");
          }

          resolve();
        } catch (error) {
          console.error("Error executing script:", error);
          // Remove the listener in case of error too
          browser.webNavigation.onDOMContentLoaded.removeListener(handleDOMContentLoaded);
          reject(error);
        }
      };

      // Add the one-time event listener
      browser.webNavigation.onDOMContentLoaded.addListener(handleDOMContentLoaded);
    } catch (error) {
      console.error("Error in submitPrompt:", error);
      reject(error);
    }
  });
}
