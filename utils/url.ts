/**
 * Utility functions for URL operations
 */

/**
 * Checks if a URL is from YouTube
 * @param url The URL to check
 * @returns True if the URL is from YouTube
 */
export function isYouTube(url: string | undefined): boolean {
  return !!url?.includes("youtube.com") || !!url?.includes("youtu.be");
}

/**
 * Gets a URL parameter value by name
 * @param url The URL to extract the parameter from
 * @param paramName The name of the parameter to extract
 * @returns The parameter value or null if not found
 */
export function getUrlParameter(url: string | undefined, paramName: string): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get(paramName);
  } catch (error) {
    console.error("Error parsing URL:", error);
    return null;
  }
}
