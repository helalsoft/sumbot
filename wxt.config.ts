import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/i18n/module"],
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: () => ({
    name: "__MSG_extName__",
    description: "__MSG_extDescription__",
    default_locale: "en",
    action: {
      default_title: "__MSG_extName__",
      default_icon: "icon/default/16.png",
    },
    icons: {
      16: "icon/default/16.png",
      19: "icon/default/19.png",
      38: "icon/default/38.png",
      48: "icon/default/48.png",
      96: "icon/default/96.png",
      128: "icon/default/128.png",
    },
    host_permissions: ["<all_urls>"],
    permissions: ["activeTab", "webNavigation", "scripting", "contextMenus", "storage"],
    ...(import.meta.env.BROWSER === "firefox"
      ? {
          browser_specific_settings: {
            gecko: {
              id: "{8d550bcd-9372-4c41-9c5e-2e4d0aaa0264}",
              strict_min_version: "109.0",
            },
          },
        }
      : {}),
  }),
});
