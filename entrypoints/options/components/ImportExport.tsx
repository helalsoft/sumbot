import { useState, useMemo } from "react";
import { i18n } from "#i18n";
import { exportSettings, importSettings } from "@/utils/importExport";

const ImportExport = () => {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      if (confirm(i18n.t("importConfirmation"))) {
        await importSettings(file);
        alert(i18n.t("importSettingsSuccess"));
        window.location.reload();
      }
    } catch (error) {
      console.error("Import error:", error);
      alert(i18n.t("importSettingsError"));
    } finally {
      setIsImporting(false);
      e.target.value = ""; // Reset file input
    }
  };

  const handleExport = async () => {
    try {
      await exportSettings();
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  // Create the full text with dynamic button replacements
  const settingsText = useMemo(() => {
    const template = i18n.t("settingsManagementText");

    // Find all {{placeholder}} matches
    const matches = [...template.matchAll(/\{\{([^}]+)\}\}/g)];

    // If no matches are found, just return the template as is
    if (matches.length === 0) return template;

    // Split text into segments
    let result: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, idx) => {
      const [fullMatch, buttonText] = match;
      const matchIndex = match.index as number;

      // Add text before the placeholder
      if (matchIndex > lastIndex) {
        result.push(<span key={`text-${idx}`}>{template.substring(lastIndex, matchIndex)}</span>);
      }

      // Determine if this is export or import button based on index
      // First placeholder is export, second is import
      if (idx === 0) {
        // Export button
        result.push(
          <button
            key={`export-btn-${idx}`}
            type="button"
            onClick={() => {
              if (!isImporting) {
                handleExport();
              }
            }}
            className={`font-semibold text-foreground/90 hover:text-foreground hover:underline focus:underline focus:outline-none transition-colors ${
              isImporting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
            disabled={isImporting}
            aria-disabled={isImporting}
          >
            {buttonText}
          </button>
        );
      } else {
        // Import button
        result.push(
          <input
            key={`import-input-${idx}`}
            type="file"
            id="import-file"
            className="hidden"
            accept=".json"
            onChange={handleImport}
            disabled={isImporting}
          />
        );
        result.push(
          <button
            key={`import-btn-${idx}`}
            type="button"
            onClick={() => {
              if (!isImporting) {
                document.getElementById("import-file")?.click();
              }
            }}
            className={`font-semibold text-foreground/90 hover:text-foreground hover:underline focus:underline focus:outline-none transition-colors ${
              isImporting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
            disabled={isImporting}
            aria-disabled={isImporting}
          >
            {buttonText}
          </button>
        );
      }

      lastIndex = matchIndex + fullMatch.length;
    });

    // Add any remaining text after the last placeholder
    if (lastIndex < template.length) {
      result.push(<span key="text-end">{template.substring(lastIndex)}</span>);
    }

    return result;
  }, [isImporting]);

  return (
    <div className="text-sm text-foreground/80 bg-foreground/5 px-3 py-2 rounded border border-foreground/10">
      <p className="m-0">{settingsText}</p>
    </div>
  );
};

export default ImportExport;
