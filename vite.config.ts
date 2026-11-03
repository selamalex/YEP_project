import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ mode }) => {
  // Load environment variables from .env and .env.local into process.env so
  // server functions and Nitro SSR runtime can access non-VITE_ server secrets
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    plugins: [
      tsconfigPaths(),
      tanstackStart(),
      nitro(),
      react(),
      tailwindcss(),
    ],
  };
});
