export { extractText } from "./textExtractor";
export { extractYoutubeTranscript } from "./youtubeExtractor";

export interface ExtractedContent {
  content: string;
  timestamp: string;
  url: string;
  title?: string;
  rawHtml?: string;
  fullPageContent?: string;
}
