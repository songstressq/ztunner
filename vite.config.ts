import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import rehypeSlug from "rehype-slug";
import path from "path";
import fs from "fs";
import matter from "gray-matter";

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

        // Rutas fijas
        for (const route of routes) {
          const routeDir = path.join(distDir, route);
          fs.mkdirSync(routeDir, { recursive: true });
          fs.writeFileSync(path.join(routeDir, "index.html"), indexHtml);
        }

        // ⭐ Rutas dinámicas de guías (una por .mdx publicado)
        const guidesDir = path.resolve(__dirname, "src/guides");
        if (fs.existsSync(guidesDir)) {
          const mdxFiles = fs
            .readdirSync(guidesDir)
            .filter((f) => f.endsWith(".mdx"));

          let count = 0;
          for (const file of mdxFiles) {
            const raw = fs.readFileSync(path.join(guidesDir, file), "utf-8");
            const { data } = matter(raw);

            if (data.published === false) continue;

            const slug =
              data.slug ?? file.replace("./", "").replace(".mdx", "");
            const guideDir = path.join(distDir, "guides", slug);
            fs.mkdirSync(guideDir, { recursive: true });
            fs.writeFileSync(path.join(guideDir, "index.html"), indexHtml);
            count++;
          }

          console.log(
            `✅ [spa-routes-fallback] Generated ${routes.length} static route folders + ${count} guide routes.`,
          );
        } else {
          console.log(
            `✅ [spa-routes-fallback] Generated ${routes.length} static route folders (no guides found).`,
          );
        }
      },
    },
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
