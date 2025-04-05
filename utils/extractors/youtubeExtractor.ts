import { ExtractedContent } from ".";

export async function extractYoutubeTranscript(): Promise<ExtractedContent> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id || !tab.url) {
    throw new Error("No active tab or URL found");
  }

  try {
    // Extract video ID from URL
    const videoId = extractVideoId(tab.url);
    if (!videoId) {
      throw new Error("Could not extract YouTube video ID");
    }

    // Execute a single script to click the "more" button, then the "transcript" button, and then extract captions
    const captionsResult = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const waitForElement = (selector: string, timeout = 5000): Promise<HTMLElement | null> => {
          return new Promise(resolve => {
            const startTime = Date.now();
            const checkElement = () => {
              const element = document.querySelector(selector) as HTMLElement;
              if (element) {
                resolve(element);
              } else if (Date.now() - startTime > timeout) {
                resolve(null);
              } else {
                requestAnimationFrame(checkElement);
              }
            };
            requestAnimationFrame(checkElement);
          });
        };

        return new Promise(async resolve => {
          // Click the "more" button to expand the description section
          const expandButton = await waitForElement("tp-yt-paper-button#expand");
          if (expandButton) {
            expandButton.click();
          }

          // Wait for the transcript button to appear and click it
          const transcriptButton = await waitForElement(
            "ytd-video-description-transcript-section-renderer #primary-button button"
          );
          if (transcriptButton) {
            transcriptButton.click();
          }

          // After clicking the button, wait for the segments container to load and then extract textContent
          const segmentsContainer = await waitForElement("#segments-container");
          resolve(segmentsContainer ? segmentsContainer.textContent : "");
        });
      },
    });

    const content = ((captionsResult[0]?.result as string) || "")
      .replace(/(\r\n|\n|\r)/gm, " ")
      .replace(/\s\s+/g, " ")
      .trim();

    // Get the page title using scripting API
    const titleResult = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.title,
    });

    const title = String(titleResult[0]?.result);

    return {
      title,
      content: content || "",
      timestamp: new Date().toISOString(),
      url: tab.url,
    };
  } catch (error) {
    console.error("Failed to extract YouTube transcript:", error);
    return {
      title: "",
      content: "",
      timestamp: new Date().toISOString(),
      url: tab.url,
    };
  }
}

// Helper to extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7].length === 11 ? match[7] : null;
}

// Format seconds to MM:SS
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
