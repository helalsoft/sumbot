import { useState } from "react";
import { i18n } from "#i18n";
import { type VariableList } from "@/config";
import { Button, InfoPopup } from "./";
import { useVariables, useUpdateVariables } from "../queries";

interface VariablesProps {
  defaultVariables: VariableList;
}

const MAX_VARIABLES = 15;
const MAX_CHAR_LENGTH = 30;

export default function Variables({ defaultVariables }: VariablesProps) {
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [newVariableKey, setNewVariableKey] = useState("");
  const [newVariableValue, setNewVariableValue] = useState("");

  const { data: variables = {} } = useVariables();
  const { mutate: updateVariables } = useUpdateVariables();

  const handleAddVariable = async () => {
    if (!newVariableKey.trim()) {
      alert(i18n.t("variableNameEmpty"));
      return;
    }

    if (!newVariableValue.trim()) {
      alert(i18n.t("variableValueEmpty"));
      return;
    }

    if (newVariableKey in variables) {
      alert(i18n.t("variableKeyExists"));
      return;
    }

    if (Object.keys(variables).length >= MAX_VARIABLES) {
      alert(i18n.t("maxVariablesReached", [MAX_VARIABLES]));
      return;
    }

    const newVariables = {
      ...variables,
      [newVariableKey]: newVariableValue,
    };

    updateVariables(newVariables);
    setNewVariableKey("");
    setNewVariableValue("");
    setIsAddingVariable(false);
  };

  const handleUpdateVariable = async (key: string, value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      alert(i18n.t("variableValueEmpty"));
      return;
    }

    const updatedVariables = {
      ...variables,
      [key]: trimmedValue,
    };
    updateVariables(updatedVariables);
    setEditingVariable(null);
  };

  const handleDeleteVariable = async (key: string) => {
    const { [key]: _, ...remainingVariables } = variables;
    updateVariables(remainingVariables);
  };

  const handleResetVariables = async () => {
    if (confirm(i18n.t("resetVariablesConfirmation"))) {
      updateVariables(defaultVariables);
    }
  };

  return (
    <div className="mt-10">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-medium">{i18n.t("variablesSectionTitle")}</h2>
          <InfoPopup content={i18n.t("variablesInfoPopup", [MAX_VARIABLES])} />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleResetVariables}
            color="default"
            variant="bordered"
            size="md"
            className="w-20"
          >
            {i18n.t("resetButton")}
          </Button>
          <Button
            onClick={() => {
              if (Object.keys(variables).length >= MAX_VARIABLES) {
                alert(i18n.t("maxVariablesReached", [MAX_VARIABLES]));
                return;
              }
              setIsAddingVariable(true);
              setNewVariableKey("");
              setNewVariableValue("");
            }}
            color="primary"
            size="md"
            className="w-20"
            disabled={Object.keys(variables).length >= MAX_VARIABLES}
          >
            {i18n.t("addButton")}
          </Button>
        </div>
      </div>

      {isAddingVariable && (
        <div className="mb-4 p-4 border-l-4 border-green-500 border bg-foreground/5 rounded text-base">
          <h3 className="text-xl font-medium mb-4">{i18n.t("newVariable")}</h3>
          <div className="space-y-3">
            <div>
              <label className="block mb-1.5">{i18n.t("variableName")}</label>
              <input
                type="text"
                value={newVariableKey}
                onChange={e => {
                  const value = e.target.value.slice(0, MAX_CHAR_LENGTH);
                  setNewVariableKey(value);
                }}
                placeholder={i18n.t("variableNamePlaceholder")}
                maxLength={MAX_CHAR_LENGTH}
                minLength={1}
                required
                className="border border-foreground/20 bg-background text-foreground px-4 py-2.5 rounded w-full"
              />
            </div>
            <div>
              <label className="block mb-1.5">{i18n.t("variableValue")}</label>
              <textarea
                value={newVariableValue}
                onChange={e => {
                  setNewVariableValue(e.target.value);
                }}
                placeholder={i18n.t("variableValuePlaceholder")}
                minLength={1}
                required
                rows={4}
                className="border border-foreground/20 bg-background text-foreground px-4 py-2.5 rounded w-full resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsAddingVariable(false)} variant="bordered" color="default">
              {i18n.t("cancelButton")}
            </Button>
            <Button onClick={handleAddVariable} color="primary">
              {i18n.t("addVariableButton")}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {Object.entries(variables).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between p-2 border border-foreground/20 bg-foreground/5 rounded"
          >
            {editingVariable === key ? (
              <div className="flex-grow">
                <textarea
                  defaultValue={value}
                  className="border border-foreground/20 bg-background text-foreground px-4 py-2 rounded w-full text-base resize-none"
                  onKeyDown={e => {
                    if (e.key === "Escape") {
                      setEditingVariable(null);
                    }
                  }}
                  rows={4}
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button onClick={() => setEditingVariable(null)} variant="text" size="sm">
                    {i18n.t("cancelButton")}
                  </Button>
                  <Button
                    onClick={e => {
                      const textarea = e.currentTarget.parentElement
                        ?.previousElementSibling as HTMLTextAreaElement;
                      if (textarea) {
                        handleUpdateVariable(key, textarea.value);
                      }
                    }}
                    color="primary"
                    size="sm"
                  >
                    {i18n.t("saveButton")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm overflow-hidden whitespace-nowrap flex items-center">
                <span
                  className="ml-3 shrink-0 max-w-16 font-medium inline-block overflow-hidden text-ellipsis"
                  title={key}
                >
                  {key}
                </span>
                <span className="mx-1">::</span>
                <span className="inline-block shrink overflow-hidden text-ellipsis" title={value}>
                  {value}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              {editingVariable === key ? null : (
                <>
                  {!(key in defaultVariables) && (
                    <Button
                      onClick={() => handleDeleteVariable(key)}
                      variant="text"
                      color="danger"
                      size="sm"
                    >
                      {i18n.t("deleteButton")}
                    </Button>
                  )}
                  <Button onClick={() => setEditingVariable(key)} variant="text" size="sm">
                    {i18n.t("editButton")}
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
