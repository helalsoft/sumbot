import { useEffect, useState } from "react";
import { type ModelName, models } from "@/config";
import { STORAGE_KEYS, getStorageItemSafe, setStorageItemSafe } from "@/utils/storage";
import { i18n } from "#i18n";
import { browser } from "wxt/browser";

interface ModelSelectorProps {
  className?: string;
}

const ModelSelector = ({ className = "" }: ModelSelectorProps) => {
  const [selectedModel, setSelectedModel] = useState<ModelName>(
    Object.keys(models)[0] as ModelName
  );

  useEffect(() => {
    const loadModel = async () => {
      try {
        const modelResult = await getStorageItemSafe(STORAGE_KEYS.DEFAULT_MODEL);
        if (models[modelResult]) {
          setSelectedModel(modelResult);
        }
      } catch (error) {
        console.error("Failed to load model:", error);
      }
    };

    loadModel();
  }, []);

  const handleModelChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = event.target.value as ModelName;
    setSelectedModel(newModel);

    try {
      await setStorageItemSafe(STORAGE_KEYS.DEFAULT_MODEL, newModel);
    } catch (error) {
      console.error("Failed to save selected model:", error);
    }
  };

  const handleTestAllModels = async () => {
    try {
      await browser.runtime.sendMessage({ type: "TEST_ALL_MODELS" });
    } catch (error) {
      console.error("Failed to trigger test all models:", error);
    }
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-2xl font-medium">{i18n.t("modelSectionTitle")}</h2>
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={handleTestAllModels}
            className="p-1.5 rounded transition-opacity opacity-70 hover:opacity-100 cursor-pointer"
            title="Test all models"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-test-tube-diagonal stroke-orange-500"
            >
              <path d="M21 7 6.82 21.18a2.83 2.83 0 0 1-3.99-.01a2.83 2.83 0 0 1 0-4L17 3" />
              <path d="m16 2 6 6" />
              <path d="M12 16H4" />
            </svg>
          </button>
        )}
      </div>
      <div className="bg-foreground/5 p-4 border border-foreground/20 rounded">
        <select
          id="model"
          className="border border-foreground/20 bg-background disabled:bg-foreground/20 disabled:text-foreground text-foreground px-3 py-2.5 rounded w-full text-lg cursor-pointer"
          value={selectedModel}
          onChange={handleModelChange}
        >
          {Object.keys(models).map(model => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ModelSelector;
