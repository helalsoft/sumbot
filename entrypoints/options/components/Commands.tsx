import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ModelNameSchema,
  type CommandList,
  ConditionSchema,
  type Condition,
  ContextSchema,
  type Context,
  type ModelName,
} from "@/config";
import Button from "./Button";
import InfoPopup from "./InfoPopup";
import { useEffect, useRef } from "react";
import { useVariables } from "../queries";
import { i18n } from "#i18n";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, i18n.t("commandNameRequired")).max(32, i18n.t("maxCharactersExceeded")),
  prompt: z.string().min(1, i18n.t("promptTemplateRequired")),
  context: ContextSchema,
  model: z
    .enum(["Default", ...ModelNameSchema.options])
    .transform(value => (value === "Default" ? undefined : value)),
  conditions: z.array(ConditionSchema).optional(),
  removable: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CommandsProps {
  mode: "view" | "edit" | "add";
  command?: CommandList[string];
  isDefault?: boolean;
  onSave?: (values: {
    key: string;
    name: string;
    prompt: string;
    context: Context;
    model?: ModelName;
    conditions?: Array<Condition>;
    removable?: boolean;
  }) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
  commandKey?: string;
}

function Commands({
  mode,
  command,
  isDefault = false,
  onSave,
  onEdit,
  onDelete,
  onCancel,
  commandKey = "",
}: CommandsProps) {
  const isFormMode = mode === "edit" || mode === "add";
  const formTitle = mode === "add" ? i18n.t("newCommand") : i18n.t("editCommand");
  const saveButtonText = mode === "add" ? i18n.t("addCommandButton") : i18n.t("saveButton");
  const formClass = mode === "add" ? "border-l-4 border-green-500" : "";

  // Create a ref for the form element
  const formRef = useRef<HTMLDivElement>(null);

  // No state needed for native details element

  const { data: userVariables = {} } = useVariables();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: command
      ? {
          name: command.name,
          prompt: command.prompt,
          context: command.context,
          model: command.model,
          removable: command.removable,
          conditions:
            command.conditions?.map(condition => ({
              tokenThreshold: condition.tokenThreshold,
              alternativeModel: condition.alternativeModel,
            })) || [],
        }
      : {
          name: "",
          prompt: "",
          context: "page",
          conditions: [],
          removable: false,
        },
    mode: "onBlur",
  });

  // Field array for conditions
  const { fields, append, remove } = useFieldArray({
    control,
    name: "conditions",
  });

  // No effect needed for native details element

  useEffect(() => {
    if (isFormMode && command) {
      reset({
        name: command.name,
        prompt: command.prompt,
        context: command.context,
        model: command.model,
        conditions:
          command.conditions?.map(condition => ({
            tokenThreshold: condition.tokenThreshold,
            alternativeModel: condition.alternativeModel,
          })) || [],
      });
    }
  }, [command, isFormMode, reset]);

  // Effect to scroll to and center the form when it becomes active
  useEffect(() => {
    if (isFormMode && formRef.current) {
      // Use a small timeout to ensure the DOM has updated
      setTimeout(() => {
        formRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // Focus the first input field
        const firstInput = formRef.current?.querySelector("input, textarea") as HTMLElement;
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
  }, [isFormMode, mode, command]);

  // Watch prompt field to update it with variable buttons
  const promptValue = watch("prompt");

  // Submit handler
  const onSubmit = (data: FormValues) => {
    onSave?.({
      key: commandKey,
      ...data,
    });
  };

  // Insert template at the end of prompt
  const insertTemplate = (template: string) => {
    setValue("prompt", (promptValue || "") + template, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  // Get all available variables (default + user-defined)
  const defaultVariables = ["content", "title", "url", "timestamp", "html", "fullPageContent"];
  const allVariables = [...defaultVariables, ...Object.keys(userVariables)];

  return (
    <div
      ref={formRef}
      className={`border border-foreground/20 bg-foreground/5 p-5 rounded ${formClass}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-medium">
          {mode === "view" ? (
            <>
              {command?.name}{" "}
              <span className="text-sm text-foreground/40">
                ({isDefault ? i18n.t("defaultLabel") : i18n.t("customLabel")})
              </span>
            </>
          ) : (
            formTitle
          )}
        </h3>
        <div className="space-x-2 h-10">
          {mode === "view" ? (
            <>
              {/* Show delete button for custom commands or default commands marked as removable */}
              {(!isDefault || command?.removable === true) && (
                <Button
                  variant="text"
                  onClick={() => {
                    if (confirm(i18n.t("deleteCommandConfirmation"))) {
                      onDelete?.();
                    }
                  }}
                  color="danger"
                  size="md"
                >
                  {i18n.t("deleteButton")}
                </Button>
              )}
              <Button variant="text" onClick={onEdit} size="md">
                {i18n.t("editButton")}
              </Button>
            </>
          ) : (
            <Button variant="bordered" onClick={onCancel} color="default" size="md">
              {i18n.t("cancelButton")}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4.5">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block mb-1.5 text-lg">{i18n.t("commandName")}</label>
            {isFormMode ? (
              <>
                <input
                  type="text"
                  maxLength={32}
                  placeholder={i18n.t("commandNamePlaceholder")}
                  className={`border border-foreground/20 bg-background disabled:bg-foreground/10 disabled:text-foreground text-foreground px-4 py-2.5 rounded w-full text-lg h-[52px] ${
                    errors.name ? "border border-red-500" : ""
                  }`}
                  {...register("name")}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </>
            ) : (
              <input
                type="text"
                value={command?.name}
                disabled
                className="border border-foreground/20 bg-background disabled:bg-foreground/10 disabled:text-foreground text-foreground px-4 py-2.5 rounded w-full text-lg opacity-75 h-[52px]"
              />
            )}
          </div>
          <div className="w-1/4">
            <label className="block mb-1.5 text-lg">{i18n.t("contextLabel")}</label>
            {isFormMode ? (
              <>
                {isDefault ? (
                  <input
                    type="text"
                    value={
                      command?.context === "youtube"
                        ? i18n.t("youtubeContext")
                        : i18n.t("pageContext")
                    }
                    disabled
                    className="border border-foreground/20 bg-background disabled:bg-foreground/10 disabled:text-foreground text-foreground px-4 py-2.5 rounded w-full text-lg opacity-75 h-[52px]"
                  />
                ) : (
                  <>
                    <select
                      className={`border border-foreground/20 bg-background disabled:bg-foreground/10 disabled:text-foreground text-foreground px-3 py-2.5 rounded w-full text-lg cursor-pointer h-[52px] ${
                        errors.context ? "border border-red-500" : ""
                      }`}
                      {...register("context")}
                    >
                      <option value="page">{i18n.t("pageContext")}</option>
                      <option value="youtube">{i18n.t("youtubeContext")}</option>
                    </select>
                    {errors.context && (
                      <p className="text-red-500 text-sm mt-1">{errors.context.message}</p>
                    )}
                  </>
                )}
              </>
            ) : (
              <input
                type="text"
                value={
                  command?.context === "youtube" ? i18n.t("youtubeContext") : i18n.t("pageContext")
                }
                disabled
                className="border border-foreground/20 bg-background disabled:bg-foreground/10 disabled:text-foreground text-foreground px-4 py-2.5 rounded w-full text-lg opacity-75 h-[52px]"
              />
            )}
          </div>
          <div className="w-1/4">
            <label className="block mb-1.5 text-lg">{i18n.t("modelLabel")}</label>
            {isFormMode ? (
              <select
                className={`border border-foreground/20 bg-background disabled:bg-foreground/10 disabled:text-foreground text-foreground px-3 py-2.5 rounded w-full text-lg cursor-pointer h-[52px]`}
                {...register("model")}
              >
                <option value="Default">{i18n.t("defaultModelLabel")}</option>
                <option value="ChatGPT">ChatGPT</option>
                <option value="Perplexity">Perplexity</option>
                <option value="Grok">Grok</option>
                <option value="Gemini">Gemini</option>
                <option value="Claude">Claude</option>
                <option value="DeepSeek">DeepSeek</option>
              </select>
            ) : (
              <input
                type="text"
                value={command?.model || i18n.t("defaultModelLabel")}
                disabled
                className="border border-foreground/20 bg-background disabled:bg-foreground/10 disabled:text-foreground text-foreground px-4 py-2.5 rounded w-full text-lg opacity-75 h-[52px]"
              />
            )}
          </div>
        </div>

        <div>
          <label className="block mb-1.5 text-lg">{i18n.t("promptTemplate")}</label>
          {isFormMode ? (
            <>
              <textarea
                placeholder={i18n.t("promptTemplatePlaceholder")}
                className={`border border-foreground/20 disabled:bg-foreground/10 disabled:text-foreground bg-background text-foreground p-2.5 rounded w-full h-28 text-lg px-4 ${
                  errors.prompt ? "border border-red-500" : ""
                }`}
                {...register("prompt")}
              />
              {errors.prompt && (
                <p className="text-red-500 text-sm mt-1">{errors.prompt.message}</p>
              )}
              <details className="mt-2 select-none">
                <summary className="text-sm text-foreground/70 py-2 cursor-pointer hover:text-foreground/90">
                  {i18n.t("insertVariable")}:
                </summary>
                <div className="mt-2 flex flex-wrap gap-2">
                  {allVariables.map(variable => (
                    <div key={variable} className="flex items-center">
                      <Button
                        variant="bordered"
                        type="button"
                        onClick={() => insertTemplate(`{{${variable}}}`)}
                        color="default"
                        size="sm"
                      >
                        &#123;&#123;{variable}&#125;&#125;
                        {variable === "html" && (
                          <span className="ml-1">
                            <InfoPopup
                              className="-my-1 translate-y-1"
                              content={i18n.t("htmlVariableInfoPopup")}
                              size="small"
                            />
                          </span>
                        )}
                        {variable === "fullPageContent" && (
                          <span className="ml-1">
                            <InfoPopup
                              className="-my-1 translate-y-1"
                              content={i18n.t("fullPageContentVariableInfoPopup")}
                              size="small"
                            />
                          </span>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </details>
            </>
          ) : (
            <textarea
              value={command?.prompt}
              disabled
              className="border border-foreground/20 disabled:bg-foreground/10 disabled:text-foreground text-foreground p-2.5 rounded w-full h-28 text-lg opacity-75 px-4"
            />
          )}
        </div>

        {/* Conditions Section - Show in both view and form modes */}
        {mode === "view" && command?.conditions && command.conditions.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-1 mb-2">
              <h3 className="text-lg font-medium">{i18n.t("conditionsLabel")}</h3>
              <InfoPopup content={i18n.t("conditionsDescription")} size="small" />
            </div>
            <div className="p-4 border border-foreground/20 rounded bg-foreground/5">
              {command.conditions.map((condition, index) => (
                <div
                  key={index}
                  className="flex gap-4 items-center mb-4 pb-4 border-b border-foreground/10 last:mb-0 last:pb-0 last:border-b-0"
                >
                  <div className="flex-1">
                    <label className="block mb-1.5 text-base">
                      {i18n.t("tokenThresholdLabel")}
                    </label>
                    <input
                      type="text"
                      value={condition.tokenThreshold}
                      disabled
                      className="border border-foreground/20 bg-background disabled:bg-foreground/10 disabled:text-foreground text-foreground px-4 py-2 rounded w-full h-[42px] opacity-75 text-base"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1.5">
                      <label className="text-base">{i18n.t("alternativeModelLabel")}</label>
                    </div>
                    <input
                      type="text"
                      value={condition.alternativeModel}
                      disabled
                      className="border border-foreground/20 bg-background disabled:bg-foreground/10 disabled:text-foreground text-foreground px-4 py-2 rounded w-full h-[42px] opacity-75 text-base"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isFormMode && (
          <>
            {/* Conditions Section */}
            <div className="mt-4">
              <div className="flex items-center gap-1 mb-2">
                <h3 className="text-lg font-medium">{i18n.t("conditionsLabel")}</h3>
                <InfoPopup content={i18n.t("conditionsDescription")} size="small" />
              </div>
              <div className="p-4 border border-foreground/20 rounded bg-foreground/5">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex gap-4 items-end mb-4 pb-4 border-b border-foreground/10"
                  >
                    <div className="flex-1">
                      <label className="block mb-1.5 text-base">
                        {i18n.t("tokenThresholdLabel")}
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="border border-foreground/20 bg-background text-foreground px-4 py-2 rounded w-full h-[42px] text-base"
                        {...register(`conditions.${index}.tokenThreshold` as const, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1.5">
                        <label className="text-base">{i18n.t("alternativeModelLabel")}</label>
                      </div>
                      <select
                        className="border border-foreground/20 bg-background text-foreground px-3 py-2 rounded w-full cursor-pointer h-[42px] text-base"
                        {...register(`conditions.${index}.alternativeModel` as const)}
                      >
                        {ModelNameSchema.options.map(model => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      variant="text"
                      color="danger"
                      size="sm"
                      onClick={() => remove(index)}
                      className="mb-1"
                    >
                      {i18n.t("removeConditionButton")}
                    </Button>
                  </div>
                ))}

                <Button
                  variant="bordered"
                  color="default"
                  size="md"
                  onClick={() => {
                    append({
                      tokenThreshold: 1000,
                      alternativeModel: ModelNameSchema.options[0],
                    });
                  }}
                  className="mt-2"
                >
                  {i18n.t("addConditionButton")}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              color="primary"
              size="lg"
              className="w-full mt-4"
            >
              {saveButtonText}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default Commands;
