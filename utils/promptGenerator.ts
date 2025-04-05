import { DEFAULT_COMMANDS, DEFAULT_VARIABLES, type CommandList } from "@/config";
import { type ExtractedContent } from "@/utils/extractors";
import { STORAGE_KEYS, getStorageItemSafe } from "@/utils/storage";
import { isYouTube } from "@/utils/url";

/**
 * Gets a command prompt template safely with type checking
 * @param commands The commands object to get the prompt from
 * @param key The key of the command
 * @returns The prompt template or undefined if not found
 */
function getCommandPrompt(commands: CommandList, key: string): string | undefined {
  return key in commands ? commands[key]?.prompt : undefined;
}

/**
 * Generates a prompt by replacing variables in the command prompt template
 * @param data The extracted content data
 * @param commandKey The key of the command to use
 * @param useDefaultPrompt Whether to use the default prompt or the user-customized version
 * @returns The generated prompt with all variables replaced
 */
export async function generatePrompt(
  data: Partial<ExtractedContent>,
  commandKey: string,
  useDefaultPrompt = false
): Promise<string> {
  // Get either the default command or the user's custom command based on the toggle
  let promptTemplate = "";

  if (useDefaultPrompt) {
    // Use default prompt if it exists, otherwise fall back to appropriate context-based default
    promptTemplate =
      getCommandPrompt(DEFAULT_COMMANDS, commandKey) ||
      (isYouTube(data.url)
        ? DEFAULT_COMMANDS.summarizeTranscript.prompt
        : DEFAULT_COMMANDS.summarizeText.prompt);
  } else {
    // Get user-customized commands
    const userCommands = await getStorageItemSafe(STORAGE_KEYS.USER_GENERATED_COMMANDS);

    // Use user command if it exists, otherwise fall back to default command
    promptTemplate =
      getCommandPrompt(userCommands, commandKey) ||
      getCommandPrompt(DEFAULT_COMMANDS, commandKey) ||
      (isYouTube(data.url)
        ? DEFAULT_COMMANDS.summarizeTranscript.prompt
        : DEFAULT_COMMANDS.summarizeText.prompt);
  }

  // First, replace the content placeholders with extracted data
  let prompt = promptTemplate
    .replace(/{{content}}/g, data.content || "")
    .replace(/{{title}}/g, data.title || "")
    .replace(/{{timestamp}}/g, data.timestamp || "")
    .replace(/{{url}}/g, data.url || "")
    .replace(/{{html}}/g, data.rawHtml || "")
    .replace(/{{fullPageContent}}/g, data.fullPageContent || "");

  // Then, replace user-defined variables
  const userVariables = await getStorageItemSafe(STORAGE_KEYS.USER_GENERATED_VARIABLES);

  // Create a combined variable map with user variables overriding default variables
  const allVariables = { ...DEFAULT_VARIABLES, ...userVariables };

  // Replace all variable placeholders with their values
  for (const [key, value] of Object.entries(allVariables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    prompt = prompt.replace(regex, value);
  }

  return prompt;
}
