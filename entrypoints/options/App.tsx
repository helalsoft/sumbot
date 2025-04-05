import { useEffect, useState, useRef } from "react";
import {
  DEFAULT_COMMANDS,
  type CommandList,
  CommandListSchema,
  DEFAULT_VARIABLES,
  type Condition,
  type Context,
  type ModelName,
} from "@/config";
import { i18n } from "#i18n";
import "@/assets/tailwind.css";
import {
  Button,
  Commands,
  Variables,
  DefaultCommands,
  ImportExport,
  InfoPopup,
  ModelSelector,
  SupportMe,
} from "./components";
import { useCommands, useCommandTimestamps, useUpdateCommands } from "./queries";
import { getStorageItemSafe, setStorageItemSafe, STORAGE_KEYS } from "@/utils/storage";

// Extended command type to include timestamp for sorting
interface CommandWithTimestamp {
  command: CommandList[string];
  key: string;
  isDefault: boolean;
  timestamp: number;
}

const ScrollToTopButton = ({
  columnRef,
  isVisible,
}: {
  columnRef: React.RefObject<HTMLDivElement | null>;
  isVisible: boolean;
}) => {
  const scrollToTop = () => {
    if (columnRef.current) {
      columnRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    isVisible && (
      <div className="absolute left-0 right-0 bottom-3 flex justify-center pointer-events-none">
        <button
          onClick={scrollToTop}
          className="bg-foreground/10 hover:bg-foreground/20 text-foreground rounded-full p-1 shadow pointer-events-auto transition-opacity cursor-pointer opacity-80 hover:opacity-100"
          title={i18n.t("scrollToTop")}
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
            className="-translate-y-px"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
      </div>
    )
  );
};

function App() {
  const [newCommandKey, setNewCommandKey] = useState("");
  const [editingCommandKey, setEditingCommandKey] = useState<string | null>(null);
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);

  // Refs for scrollable columns
  const leftColumnRef = useRef<HTMLDivElement | null>(null);
  const rightColumnRef = useRef<HTMLDivElement | null>(null);

  // State for scroll position
  const [leftScrollVisible, setLeftScrollVisible] = useState(false);
  const [rightScrollVisible, setRightScrollVisible] = useState(false);

  const { data: commands = { ...DEFAULT_COMMANDS } } = useCommands();
  const { data: commandTimestamps = {} } = useCommandTimestamps();
  const { mutate: updateCommands } = useUpdateCommands();

  // Set up scroll event listeners
  useEffect(() => {
    const leftColumn = leftColumnRef.current;
    const rightColumn = rightColumnRef.current;

    const handleLeftScroll = () => {
      if (leftColumn) {
        setLeftScrollVisible(leftColumn.scrollTop > 200);
      }
    };

    const handleRightScroll = () => {
      if (rightColumn) {
        setRightScrollVisible(rightColumn.scrollTop > 200);
      }
    };

    // Add event listeners
    leftColumn?.addEventListener("scroll", handleLeftScroll);
    rightColumn?.addEventListener("scroll", handleRightScroll);

    // Initial check
    handleLeftScroll();
    handleRightScroll();

    // Cleanup
    return () => {
      leftColumn?.removeEventListener("scroll", handleLeftScroll);
      rightColumn?.removeEventListener("scroll", handleRightScroll);
    };
  }, []);

  const handleAddCommand = async (values: {
    key: string;
    name: string;
    prompt: string;
    context: Context;
    model?: ModelName;
    conditions?: Array<Condition>;
    removable?: boolean;
  }) => {
    if (newCommandKey in commands) {
      alert(i18n.t("commandKeyExists"));
      return;
    }

    const timestamp = Date.now();
    const newCommands = {
      ...commands,
      [newCommandKey]: {
        name: values.name,
        prompt: values.prompt,
        context: values.context,
        model: values.model,
        conditions: values.conditions,
        removable: values.removable,
      },
    };

    const newTimestamps = {
      ...commandTimestamps,
      [newCommandKey]: timestamp,
    };

    try {
      // Validate with schema
      const result = CommandListSchema.safeParse(newCommands);
      if (!result.success) {
        console.error(result.error.message);
        return;
      }

      updateCommands({ commands: newCommands, timestamps: newTimestamps });

      // Reset form
      setNewCommandKey("");
      // Hide add form
      setIsAddFormVisible(false);
    } catch (error) {
      console.error("Failed to save commands:", error);
      alert(i18n.t("failedToSaveCommand"));
    }
  };

  // Generate a unique key for new command
  const generateUniqueKey = () => {
    const baseKey = "customCommand";
    let counter = 1;
    let key = `${baseKey}${counter}`;

    while (key in commands) {
      counter++;
      key = `${baseKey}${counter}`;
    }

    return key;
  };

  // Show Add Command Form with a pre-generated key
  const showAddCommandForm = () => {
    setNewCommandKey(generateUniqueKey());
    setIsAddFormVisible(true);
  };

  const handleDeleteCommand = async (key: string) => {
    // Prevent deleting default commands unless they are marked as removable
    if (key in DEFAULT_COMMANDS && !(DEFAULT_COMMANDS as CommandList)[key].removable) {
      return;
    }

    const newCommands: CommandList = { ...commands };

    if (key in newCommands) {
      delete newCommands[key];

      const newTimestamps = { ...commandTimestamps };
      delete newTimestamps[key];

      // Get current default commands
      const defaultPageCommand = await getStorageItemSafe(STORAGE_KEYS.DEFAULT_PAGE_COMMAND);
      const defaultYoutubeCommand = await getStorageItemSafe(STORAGE_KEYS.DEFAULT_YOUTUBE_COMMAND);

      // If the deleted command was set as a default, update it to a fallback
      let updatedPageCommand = defaultPageCommand;
      let updatedYoutubeCommand = defaultYoutubeCommand;

      if (defaultPageCommand === key) {
        // Find another page command to use as default
        const availablePageCommands = Object.entries(newCommands)
          .filter(([_, cmd]) => cmd.context === "page")
          .map(([k]) => k);

        updatedPageCommand =
          availablePageCommands.length > 0 ? availablePageCommands[0] : "summarizeText"; // Fallback to default

        await setStorageItemSafe(STORAGE_KEYS.DEFAULT_PAGE_COMMAND, updatedPageCommand);
      }

      if (defaultYoutubeCommand === key) {
        // Find another youtube command to use as default
        const availableYoutubeCommands = Object.entries(newCommands)
          .filter(([_, cmd]) => cmd.context === "youtube")
          .map(([k]) => k);

        updatedYoutubeCommand =
          availableYoutubeCommands.length > 0 ? availableYoutubeCommands[0] : "summarizeTranscript"; // Fallback to default

        await setStorageItemSafe(STORAGE_KEYS.DEFAULT_YOUTUBE_COMMAND, updatedYoutubeCommand);
      }

      // Update commands with deletedKey to trigger the invalidation of default command queries
      updateCommands({
        commands: newCommands,
        timestamps: newTimestamps,
        deletedKey: key,
      });
    }
  };

  const handleUpdateCommand = async (values: {
    key: string;
    name: string;
    prompt: string;
    context: Context;
    model?: ModelName;
    conditions?: Array<Condition>;
    removable?: boolean;
  }) => {
    const { key, ...commandData } = values;
    const newCommands: CommandList = {
      ...commands,
      [key]: commandData,
    };

    updateCommands({ commands: newCommands, timestamps: commandTimestamps });
    setEditingCommandKey(null);
  };

  const resetCommands = async () => {
    if (confirm(i18n.t("resetCommandsConfirmation"))) {
      updateCommands({ commands: DEFAULT_COMMANDS, timestamps: {} });
      setEditingCommandKey(null);
    }
  };

  // Get commands sorted by timestamp (most recent first)
  const getSortedCommands = (): CommandWithTimestamp[] => {
    return Object.entries(commands)
      .map(([key, command]) => {
        // Check if this is a default command with removable property
        const isRemovable =
          key in DEFAULT_COMMANDS && (DEFAULT_COMMANDS as CommandList)[key].removable === true;

        // If it's a default command with removable=true, make sure the command object has that property
        if (isRemovable && !command.removable) {
          command = { ...command, removable: true };
        }

        return {
          command,
          key,
          isDefault: key in DEFAULT_COMMANDS,
          timestamp: commandTimestamps[key] || 0,
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen max-w-[1024px] mx-auto">
      <div className="flex items-center justify-between px-4 py-6 border-b border-foreground/10">
        <div className="flex items-center">
          <img src="/icon/default/96.png" alt={i18n.t("sumbotLogo")} className="mr-3 h-10 w-10" />
          <h1 className="text-3xl font-bold text-foreground/70">{i18n.t("optionsTitle")}</h1>
        </div>
        <div className="flex items-stretch gap-3 pr-2">
          <ImportExport />
          <SupportMe />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Model Selection */}
        <div className="w-96 relative flex flex-col border-foreground/10">
          <div className="overflow-y-auto p-4 flex-1 pb-20 " ref={leftColumnRef}>
            <ModelSelector />

            {/* Default Commands Section */}
            <DefaultCommands
              key={`default-commands-${Object.keys(commands).length}`}
              userCommands={commands}
            />

            {/* Variables Section */}
            <Variables defaultVariables={DEFAULT_VARIABLES} />
          </div>

          {/* Scroll to top button for left column - only visible when scrolled */}
          <ScrollToTopButton columnRef={leftColumnRef} isVisible={leftScrollVisible} />
        </div>

        {/* Right Column - Commands */}
        <div className="flex-1 relative flex flex-col">
          <div className="overflow-y-auto px-4 pb-20 flex-1" ref={rightColumnRef}>
            <div className="flex justify-between items-center mb-4 pt-4 pb-2 bg-background sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-medium">{i18n.t("commandsSectionTitle")}</h2>
                <InfoPopup content={i18n.t("commandsInfoPopup")} />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={resetCommands}
                  color="default"
                  variant="bordered"
                  size="md"
                  className="w-24"
                >
                  {i18n.t("resetButton")}
                </Button>
                <Button onClick={showAddCommandForm} color="primary" size="md" className="w-24">
                  {i18n.t("addButton")}
                </Button>
              </div>
            </div>

            <div className="space-y-4.5">
              {/* Add New Command Form */}
              {isAddFormVisible && (
                <Commands
                  key={`add-${newCommandKey}`}
                  mode="add"
                  commandKey={newCommandKey}
                  onSave={handleAddCommand}
                  onCancel={() => setIsAddFormVisible(false)}
                />
              )}

              {/* Display sorted commands */}
              {getSortedCommands().map(({ key, command, isDefault }) => {
                const isEditing = editingCommandKey === key;

                if (isEditing) {
                  return (
                    <Commands
                      key={`edit-${key}`}
                      mode="edit"
                      command={command}
                      commandKey={key}
                      isDefault={isDefault}
                      onSave={handleUpdateCommand}
                      onCancel={() => setEditingCommandKey(null)}
                    />
                  );
                }

                return (
                  <Commands
                    key={key}
                    mode="view"
                    command={command}
                    isDefault={isDefault}
                    onEdit={() => setEditingCommandKey(key)}
                    onDelete={() => handleDeleteCommand(key)}
                  />
                );
              })}
            </div>
          </div>

          {/* Scroll to top button for right column - only visible when scrolled */}
          <ScrollToTopButton columnRef={rightColumnRef} isVisible={rightScrollVisible} />
        </div>
      </div>
    </div>
  );
}

export default App;
