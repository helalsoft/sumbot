import { i18n } from "#i18n";

const SupportMe = () => {
  return (
    <a
      href={import.meta.env.WXT_SUPPORT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-foreground/90 bg-foreground/5 hover:bg-foreground/10 border-foreground/10 border rounded focus:outline-none transition-colors cursor-pointer flex items-center gap-1.5 pl-3 pr-4 py-2 text-sm"
    >
      <span className="scale-110">💚</span>
      <span>{i18n.t("supportMe")}</span>
    </a>
  );
};

export default SupportMe;
