import { z } from "zod";
import { i18n } from "#i18n";

export type IconStateType = "default" | "processing" | "disabled";

type IconPathMap = {
  [K in IconStateType]: {
    [key: string]: string;
  };
};

export const iconPaths: IconPathMap = {
  default: {
    "16": "icon/default/16.png",
    "19": "icon/default/19.png",
    "38": "icon/default/38.png",
    "48": "icon/default/48.png",
    "96": "icon/default/96.png",
    "128": "icon/default/128.png",
  },
  processing: {
    "16": "icon/processing/16.png",
    "19": "icon/processing/19.png",
    "38": "icon/processing/38.png",
    "48": "icon/processing/48.png",
    "96": "icon/processing/96.png",
    "128": "icon/processing/128.png",
  },
  disabled: {
    "16": "icon/disabled/16.png",
    "19": "icon/disabled/19.png",
    "38": "icon/disabled/38.png",
    "48": "icon/disabled/48.png",
    "96": "icon/disabled/96.png",
    "128": "icon/disabled/128.png",
  },
};

export const ModelNameSchema = z.enum([
  "ChatGPT",
  "Perplexity",
  "Grok",
  "Gemini",
  "AI Studio",
  "Claude",
  "DeepSeek",
]);

export type ModelName = z.infer<typeof ModelNameSchema>;

export const DEFAULT_MODEL: ModelName = "Gemini";

const ModelDetailsSchema = z.object({
  url: z.string().url("Invalid URL"),
  input: z.array(z.string()).nonempty("At least one input selector is required"),
  button: z.array(z.string()).nonempty("At least one button selector is required"),
  cleanInput: z.boolean().optional(),
});

export type ModelDetails = z.infer<typeof ModelDetailsSchema>;

const ModelListSchema = z.record(ModelNameSchema, ModelDetailsSchema);

export type ModelList = z.infer<typeof ModelListSchema>;

export const models = {
  ChatGPT: {
    url: "https://chatgpt.com/",
    input: ["#prompt-textarea > p"],
    button: ["[data-testid=send-button]"],
  },
  Perplexity: {
    url: "https://perplexity.ai/",
    input: [`div#ask-input[contenteditable="true"][data-lexical-editor="true"]`],
    button: ["button:has(svg use[*|href$='pplx-icon-arrow-right'])"],
  },
  Grok: {
    url: "https://grok.com/",
    input: ["textarea", "div[contenteditable='true']"],
    button: ["button[type='submit']"],
  },
  Gemini: {
    url: "https://gemini.google.com/app",
    input: ["rich-textarea .ql-editor[contenteditable='true']"],
    button: ["button[mat-icon-button].send-button mat-icon[fonticon='send']"],
  },
  "AI Studio": {
    url: "https://aistudio.google.com/prompts/new_chat",
    input: ["ms-prompt-box textarea[formcontrolname='promptText']"],
    button: ["button[ms-button][type='submit']"],
    cleanInput: true,
  },
  Claude: {
    url: "https://claude.ai",
    input: ["div[contenteditable='true'] p"],
    button: [
      "button:has([d='M208.49,120.49a12,12,0,0,1-17,0L140,69V216a12,12,0,0,1-24,0V69L64.49,120.49a12,12,0,0,1-17-17l72-72a12,12,0,0,1,17,0l72,72A12,12,0,0,1,208.49,120.49Z']",
    ],
    cleanInput: true,
  },
  DeepSeek: {
    url: "https://chat.deepseek.com/",
    input: ["textarea.ds-scroll-area[placeholder*='DeepSeek']"],
    button: ["div.ds-icon-button[role='button']:has(svg path[d*='M8.3125 0.981587'])"],
  },
} as const satisfies ModelList;

// Define a schema for condition-based model selection
export const ConditionSchema = z.object({
  tokenThreshold: z.number().int().positive(),
  alternativeModel: ModelNameSchema,
});

export type Condition = z.infer<typeof ConditionSchema>;

// Define context types for commands
export const ContextSchema = z.enum(["page", "youtube"], {
  errorMap: () => ({ message: i18n.t("selectValidContext") }),
});
export type Context = z.infer<typeof ContextSchema>;

const CommandSchema = z.object({
  name: z.string().min(1, "Command name is required"),
  prompt: z.string().min(1, "Prompt is required"),
  model: ModelNameSchema.optional(),
  context: ContextSchema.optional(),
  conditions: z.array(ConditionSchema).optional(),
  removable: z.boolean().optional(),
});

export const CommandListSchema = z.record(z.string(), CommandSchema);

export type CommandList = z.infer<typeof CommandListSchema>;

export const DEFAULT_COMMANDS = {
  generateToDos: {
    name: i18n.t("generateTodoList"),
    prompt: i18n.t("generateTodoListPrompt", ["{{language}}", "{{content}}"]),
    context: "page",
    removable: true
  },
  summarizeText: {
    name: i18n.t("defaultCommandPage"),
    prompt: i18n.t("summarizeTextPrompt", ["{{language}}", "{{title}}", "{{content}}"]),
    context: "page"
  },
  summarizeTranscript: {
    name: i18n.t("defaultCommandYoutube"),
    prompt: i18n.t("summarizeTranscriptPrompt", ["{{language}}", "{{title}}", "{{content}}"]),
    context: "youtube"
  },
} as const satisfies CommandList;

export const DEFAULT_PAGE_COMMAND: keyof typeof DEFAULT_COMMANDS = "summarizeText";
export const DEFAULT_YOUTUBE_COMMAND: keyof typeof DEFAULT_COMMANDS = "summarizeTranscript";

const VariableListSchema = z.record(z.string(), z.string());

export type VariableList = z.infer<typeof VariableListSchema>;

export const DEFAULT_VARIABLES: VariableList = {
  language: i18n.t("language"),
};
