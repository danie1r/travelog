import { createApp } from 'vue';
import App from '../components/Overlay.vue';
import './style.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const excludedUrls = ["https://www.google.com/*", "https://www.google.com"];
    const currentUrl = window.location.href;
    if (excludedUrls.some(url => new RegExp(url.replace('*', '.*')).test(currentUrl))) {
      return; // Exit if the current URL matches any of the exclude patterns
    }
    const ui = await createShadowRootUi(ctx, {
      name: 'example-ui',
      position: 'inline',
      onMount: (container) => {
        // Define how your UI will be mounted inside the container
        const app = createApp(App);
        app.mount(container);
        return app;
      },
      onRemove: (app) => {
        // Unmount the app when the UI is removed
        app?.unmount();
      },
    });

    // 4. Mount the UI
    ui.mount();
  },
});