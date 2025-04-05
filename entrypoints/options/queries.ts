import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  extensionStorage,
  STORAGE_KEYS,
  getStorageItemSafe,
  setStorageItemSafe,
} from "@/utils/storage";
import type { CommandList, VariableList } from "@/config";

// Query keys
export const QUERY_KEYS = {
  commands: ["commands"] as const,
  variables: ["variables"] as const,
  commandTimestamps: ["commandTimestamps"] as const,
  defaultPageCommand: ["defaultPageCommand"] as const,
  defaultYoutubeCommand: ["defaultYoutubeCommand"] as const,
} as const;

// Commands queries and mutations
export const useCommands = () => {
  return useQuery({
    queryKey: QUERY_KEYS.commands,
    queryFn: async () => {
      try {
        return await getStorageItemSafe(STORAGE_KEYS.USER_GENERATED_COMMANDS);
      } catch (error) {
        console.error("Failed to fetch commands:", error);
        return {};
      }
    },
  });
};

export const useCommandTimestamps = () => {
  return useQuery({
    queryKey: QUERY_KEYS.commandTimestamps,
    queryFn: async () => {
      try {
        return await getStorageItemSafe(STORAGE_KEYS.COMMAND_TIMESTAMPS);
      } catch (error) {
        console.error("Failed to fetch command timestamps:", error);
        return {};
      }
    },
  });
};

export const useUpdateCommands = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commands,
      timestamps,
      deletedKey,
    }: {
      commands: CommandList;
      timestamps: Record<string, number>;
      deletedKey?: string;
    }) => {
      await setStorageItemSafe(STORAGE_KEYS.USER_GENERATED_COMMANDS, commands);
      await setStorageItemSafe(STORAGE_KEYS.COMMAND_TIMESTAMPS, timestamps);

      // If a key was deleted, check if it was set as a default command
      if (deletedKey) {
        const defaultPageCommand = await getStorageItemSafe(STORAGE_KEYS.DEFAULT_PAGE_COMMAND);
        const defaultYoutubeCommand = await getStorageItemSafe(
          STORAGE_KEYS.DEFAULT_YOUTUBE_COMMAND
        );

        // If the deleted key was set as a default command, reset it to fallback value
        if (defaultPageCommand === deletedKey) {
          await setStorageItemSafe(STORAGE_KEYS.DEFAULT_PAGE_COMMAND, "summarizeText");
        }

        if (defaultYoutubeCommand === deletedKey) {
          await setStorageItemSafe(STORAGE_KEYS.DEFAULT_YOUTUBE_COMMAND, "summarizeTranscript");
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.commands });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.commandTimestamps });

      // If a key was deleted, also invalidate default command queries
      if (variables.deletedKey) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.defaultPageCommand });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.defaultYoutubeCommand });
      }
    },
  });
};

// Default command queries and mutations
export const useDefaultPageCommand = () => {
  return useQuery({
    queryKey: QUERY_KEYS.defaultPageCommand,
    queryFn: async () => {
      try {
        return await getStorageItemSafe(STORAGE_KEYS.DEFAULT_PAGE_COMMAND);
      } catch (error) {
        console.error("Failed to fetch default page command:", error);
        return "summarizeText";
      }
    },
  });
};

export const useDefaultYoutubeCommand = () => {
  return useQuery({
    queryKey: QUERY_KEYS.defaultYoutubeCommand,
    queryFn: async () => {
      try {
        return await getStorageItemSafe(STORAGE_KEYS.DEFAULT_YOUTUBE_COMMAND);
      } catch (error) {
        console.error("Failed to fetch default youtube command:", error);
        return "summarizeTranscript";
      }
    },
  });
};

export const useUpdateDefaultPageCommand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commandKey: string) => {
      await setStorageItemSafe(STORAGE_KEYS.DEFAULT_PAGE_COMMAND, commandKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.defaultPageCommand,
      });
    },
  });
};

export const useUpdateDefaultYoutubeCommand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commandKey: string) => {
      await setStorageItemSafe(STORAGE_KEYS.DEFAULT_YOUTUBE_COMMAND, commandKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.defaultYoutubeCommand,
      });
    },
  });
};

// Variables queries and mutations
export const useVariables = () => {
  return useQuery({
    queryKey: QUERY_KEYS.variables,
    queryFn: async () => {
      try {
        return await getStorageItemSafe(STORAGE_KEYS.USER_GENERATED_VARIABLES);
      } catch (error) {
        console.error("Failed to fetch variables:", error);
        return {};
      }
    },
  });
};

export const useUpdateVariables = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: VariableList) => {
      await setStorageItemSafe(STORAGE_KEYS.USER_GENERATED_VARIABLES, variables);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.variables });
    },
  });
};
