/**
 * A simple utility to estimate token count for a text string
 * This is a rough approximation - actual token counts may vary by model
 *
 * @param text The text to count tokens for
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
  // Simple approximation: 1 token is roughly 4 characters for English text
  // This is a very rough estimate and will vary by language and content
  return Math.ceil(text.length / 4);
}
