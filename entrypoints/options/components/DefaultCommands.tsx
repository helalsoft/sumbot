import { useState, useEffect } from "react";
import { type CommandList, DEFAULT_COMMANDS } from "@/config";
import {
  useCommands,
  useDefaultPageCommand,
  useDefaultYoutubeCommand,
  useUpdateDefaultPageCommand,
  useUpdateDefaultYoutubeCommand,
} from "../queries";
import { InfoPopup } from ".";
import { i18n } from "#i18n";

interface DefaultCommandsProps {
  userCommands?: CommandList;
}

export default function DefaultCommands({ userCommands: propUserCommands }: DefaultCommandsProps) {
  const { data: storeUserCommands = {} } = useCommands();

  // Use the prop userCommands if provided, otherwise use the ones from the store
  const userCommands = propUserCommands || storeUserCommands;

  // Log when the component is re-rendered with new commands
  useEffect(() => {
    console.log("DefaultCommands re-rendered with:", {
      userCommandsCount: Object.keys(userCommands).length,
      defaultCommandsCount: Object.keys(DEFAULT_COMMANDS).length,
    });
  }, [userCommands]);
  const { data: defaultPageCommand = "summarizeText" } = useDefaultPageCommand();
  const { data: defaultYoutubeCommand = "summarizeTranscript" } = useDefaultYoutubeCommand();
  const { mutate: updateDefaultPageCommand } = useUpdateDefaultPageCommand();
  const { mutate: updateDefaultYoutubeCommand } = useUpdateDefaultYoutubeCommand();

  const [selectedPageCommand, setSelectedPageCommand] = useState(defaultPageCommand);
  const [selectedYoutubeCommand, setSelectedYoutubeCommand] = useState(defaultYoutubeCommand);

  // Only use user commands, not default commands
  const allCommands = {
    ...userCommands,
  };

  // Filter commands by context
  const pageCommands = Object.entries(allCommands).filter(
    ([_, command]) => (command as CommandList[string]).context === "page"
  );

  const youtubeCommands = Object.entries(allCommands).filter(
    ([_, command]) => (command as CommandList[string]).context === "youtube"
  );

  // Update local state when query data changes
  useEffect(() => {
    setSelectedPageCommand(defaultPageCommand);
  }, [defaultPageCommand]);

  useEffect(() => {
    setSelectedYoutubeCommand(defaultYoutubeCommand);
  }, [defaultYoutubeCommand]);

  // Update when commands change (e.g., when a command is deleted)
  useEffect(() => {
    // Force update of the select options when commands change
    const updateSelectOptions = () => {
      // Check if the currently selected page command still exists
      const pageCommandExists = Object.entries(allCommands).some(
        ([key, cmd]) =>
          key === selectedPageCommand && (cmd as CommandList[string]).context === "page"
      );

      if (!pageCommandExists && pageCommands.length > 0) {
        const [firstKey] = pageCommands[0];
        console.log("Updating page command to:", firstKey);
        setSelectedPageCommand(firstKey);
        updateDefaultPageCommand(firstKey);
      }

      // Check if the currently selected YouTube command still exists
      const youtubeCommandExists = Object.entries(allCommands).some(
        ([key, cmd]) =>
          key === selectedYoutubeCommand && (cmd as CommandList[string]).context === "youtube"
      );

      if (!youtubeCommandExists && youtubeCommands.length > 0) {
        const [firstKey] = youtubeCommands[0];
        console.log("Updating youtube command to:", firstKey);
        setSelectedYoutubeCommand(firstKey);
        updateDefaultYoutubeCommand(firstKey);
      }
    };

    // Run the update
    updateSelectOptions();

    // Also run it after a short delay to ensure the UI has updated
    const timeoutId = setTimeout(updateSelectOptions, 100);
    return () => clearTimeout(timeoutId);
  }, [
    userCommands,
    selectedPageCommand,
    selectedYoutubeCommand,
    updateDefaultPageCommand,
    updateDefaultYoutubeCommand,
    allCommands,
    pageCommands,
    youtubeCommands,
  ]);

  const handlePageCommandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setSelectedPageCommand(newValue);
    updateDefaultPageCommand(newValue);
  };

  const handleYoutubeCommandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setSelectedYoutubeCommand(newValue);
    updateDefaultYoutubeCommand(newValue);
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-medium">{i18n.t("defaultCommandsTitle")}</h2>
        <InfoPopup content={i18n.t("defaultCommandsInfoPopup")} />
      </div>

      <div className="space-y-4">
        {/* Page Commands */}
        <div className="p-4 border border-foreground/20 bg-foreground/5 rounded">
          <h3 className="text-lg font-medium mb-3">{i18n.t("pageCommandTitle")}</h3>
          <select
            value={
              pageCommands.some(([k]) => k === selectedPageCommand)
                ? selectedPageCommand
                : pageCommands.length > 0
                  ? pageCommands[0][0]
                  : ""
            }
            onChange={handlePageCommandChange}
            className="border border-foreground/20 bg-background text-foreground px-3 py-2.5 rounded text-lg cursor-pointer h-[52px] w-full"
          >
            {pageCommands.map(([key, command]) => (
              <option key={key} value={key}>
                {(command as CommandList[string]).name}
              </option>
            ))}
          </select>
        </div>

        {/* YouTube Commands */}
        <div className="p-4 border border-foreground/20 bg-foreground/5 rounded">
          <h3 className="text-lg font-medium mb-3">{i18n.t("youtubeCommandTitle")}</h3>
          <select
            value={
              youtubeCommands.some(([k]) => k === selectedYoutubeCommand)
                ? selectedYoutubeCommand
                : youtubeCommands.length > 0
                  ? youtubeCommands[0][0]
                  : ""
            }
            onChange={handleYoutubeCommandChange}
            className="border border-foreground/20 bg-background text-foreground px-3 py-2.5 rounded text-lg cursor-pointer h-[52px] w-full"
          >
            {youtubeCommands.map(([key, command]) => (
              <option key={key} value={key}>
                {(command as CommandList[string]).name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
