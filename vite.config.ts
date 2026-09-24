import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import rehypeSlug from "rehype-slug";
import path from "path";
import fs from "fs";

export default defineConfig({
  base: "/",
  plugins: [
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [remarkGfm, remarkFrontmatter, remarkMdxFrontmatter],
        rehypePlugins: [rehypeSlug],
        providerImportSource: "@mdx-js/react",
      }),
    },
    react(),
    {
      name: "spa-routes-fallback",
      closeBundle() {
        const routes = [
          "zzz-damage-calculator",
          "zzz-build-manager",
          "zzz-disc-inventory",
          "zzz-build-creator",
          "info-settings",
          "guides",
        ];
        const distDir = path.resolve(__dirname, "dist");
        const indexHtml = fs.readFileSync(
          path.join(distDir, "index.html"),
          "utf-8",
        );
        for (const route of routes) {
          const routeDir = path.join(distDir, route);
          fs.mkdirSync(routeDir, { recursive: true });
          fs.writeFileSync(path.join(routeDir, "index.html"), indexHtml);
        }
        console.log(
          `✅ [spa-routes-fallback] Generated ${routes.length} static route folders.`,
        );
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
