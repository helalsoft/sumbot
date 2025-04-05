import ReactDOM from "react-dom/client";
import "@/assets/tailwind.css";
import { onMessage } from "@/utils/messaging";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "processing-ui",
      position: "inline",
      anchor: "body",
      onMount: async container => {
        const app = document.createElement("div");
        container.append(app);

        const root = ReactDOM.createRoot(app);

        root.render(
          <p
            className="fixed inset-0 flex items-center justify-center bg-black/50 font-bold text-white animate-pulse"
            style={{ zIndex: 2147483647, fontSize: "24px" }}
          >
            {i18n.t("sendingContentMessage")}
          </p>
        );
        return root;
      },
      onRemove: async root => {
        (await root)?.unmount();
      },
    });

    onMessage("toggleProcessingUI", async message => {
      if (message.data) {
        ui.mount();
      } else {
        ui.remove();
      }
    });

    onMessage("showAlert", async message => alert(message.data));
  },
});
