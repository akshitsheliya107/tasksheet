import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

const buildTimestamp = Date.now();

const versionPlugin = () => {
  return {
    name: 'version-plugin',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version: buildTimestamp })
      });
    }
  };
};

export default defineConfig({
  plugins: [react(), tailwindcss(), versionPlugin()],
  define: {
    __APP_VERSION__: buildTimestamp,
  }
});
