import { defineConfig } from 'wxt';
import vue from '@vitejs/plugin-vue';

// See https://wxt.dev/api/config.html
export default defineConfig({
  imports: {
    addons: {
      vueTemplate: true,
    },
  },
  vite: () => ({
    plugins: [vue()],
  }),
  manifest: {
    permissions: ['storage', "tabs", "activeTab", 'scripting', 'contextMenus', 'management'],
    web_accessible_resources: [
      {
        resources: ['entrypoints/overlay.content/index.html'],
        matches: ['<all_urls>'],
      },
    ],
    browser_action: {},
    host_permissions: ["<all_urls>"],
  },
});
