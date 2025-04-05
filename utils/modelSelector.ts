import { models, type ModelDetails, type ModelName } from "@/config";
import { STORAGE_KEYS, getStorageItemSafe } from "@/utils/storage";
import { estimateTokenCount } from "@/utils/tokenCounter";

/**
 * Selects the appropriate model based on text content, command conditions, and optional override
 *
 * @param text The text content to be submitted
 * @param commandKey Optional command key to check for conditions
 * @param modelOverride Optional model override that is used if no conditions are met
 * @returns The selected model key and model details
 */
export async function selectModel(
  text: string,
  commandKey?: string,
  modelOverride?: ModelName
): Promise<{ modelKey: ModelName; model: ModelDetails }> {
  // Initialize selectedModelKey with the model override if provided
  // Note: Conditions will take precedence over this if they are met
  let selectedModelKey: ModelName | undefined = modelOverride;

  // Check conditions if a command key exists, regardless of model override
  if (commandKey) {
    const userCommands = await getStorageItemSafe(STORAGE_KEYS.USER_GENERATED_COMMANDS);
    const command = userCommands[commandKey];

    if (command && command.conditions && command.conditions.length > 0) {
      // Estimate token count for the prompt
      const tokenCount = estimateTokenCount(text);

      // Sort conditions by threshold (highest first) to check largest thresholds first
      const sortedConditions = [...command.conditions].sort(
        (a, b) => b.tokenThreshold - a.tokenThreshold
      );

      // Find the first condition where token count exceeds the threshold
      for (const condition of sortedConditions) {
        if (tokenCount > condition.tokenThreshold) {
          const overrideMsg = modelOverride ? ` (overriding command model: ${modelOverride})` : "";
          console.log(
            `Token count ${tokenCount} exceeds threshold ${condition.tokenThreshold}, ` +
              `using alternative model: ${condition.alternativeModel}${overrideMsg}`
          );
          selectedModelKey = condition.alternativeModel;
          break;
        }
      }
    }
  }

  // If no model was selected from conditions, use the override or default
  if (!selectedModelKey) {
    selectedModelKey = modelOverride || (await getStorageItemSafe(STORAGE_KEYS.DEFAULT_MODEL));
  }

  // Type guard to ensure modelKey is a valid key
  if (!(selectedModelKey in models)) {
    throw new Error(`Invalid model key: ${selectedModelKey}`);
  }

  const model = models[selectedModelKey];

  if (!model) {
    throw new Error(`Model ${selectedModelKey} not found`);
  }

  return { modelKey: selectedModelKey, model };
}
