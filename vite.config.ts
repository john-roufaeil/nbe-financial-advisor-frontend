import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";

export default defineConfig({
  server: {
    host: true, // bind to 0.0.0.0 inside Docker
    watch: {
      // bind-mounted source on Docker Desktop/WSL doesn't always propagate
      // inotify events reliably, so fall back to polling.
      usePolling: true,
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: [["babel-plugin-react-compiler", {}]],
      },
    }),
  ],
});
