import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command }) => ({
  plugins: [
    devtools({
      logging: false,
      eventBusConfig: { enabled: false },
      enhancedLogs: { enabled: false },
      consolePiping: { enabled: false },
      removeDevtoolsOnBuild: false,
      injectSource: { enabled: true },
    }),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      // nitro/vite builds from this
      server: { entry: "server" },
    }),
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    // Build-only deploy target — emits Vercel Build Output API layout (.vercel/output).
    // Kept out of `vite dev` so SSR runs through TanStack Start's dev environment,
    // which is what tracks modules for HMR; the nitro dev runner uses a separate
    // graph that reports "[no modules matched]" for app files.
    // Preset name verified against TanStack Start's hosting docs (nitro/vite plugin).
    ...(command === "build" ? [nitro({ preset: "vercel" })] : []),
    viteReact(),
  ],
  resolve: {
    alias: { "@": `${process.cwd()}/src` },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  server: {
    // Preview environments serve the app through a *.monkeycode-ai.live host.
    allowedHosts: [".monkeycode-ai.live"],
  },
}));
