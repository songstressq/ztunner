import type { ComponentType } from "react";

export interface GuideMeta {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  updated?: string;
  published: boolean;
  toc?: boolean;
  cover?: string;
}

interface MDXModule {
  default: ComponentType;
  frontmatter: Partial<GuideMeta>;
}

// ⭐ Un solo glob eager. Vite expone el módulo compilado con
// `frontmatter` (gracias a remark-mdx-frontmatter) y `default` (componente).
const mdxModules = import.meta.glob("./*.mdx", { eager: true }) as Record<
  string,
  MDXModule
>;

const slugFromPath = (p: string) => p.replace("./", "").replace(".mdx", "");

export const getAllGuides = (): GuideMeta[] => {
  return Object.entries(mdxModules)
    .map(([path, mod]) => {
      const fm = mod.frontmatter ?? {};
      return {
        slug: fm.slug ?? slugFromPath(path),
        title: fm.title ?? "Untitled",
        description: fm.description ?? "",
        tags: fm.tags ?? [],
        date: fm.date ?? "1970-01-01",
        updated: fm.updated,
        published: fm.published !== false,
        toc: fm.toc !== false,
        cover: fm.cover,
      } as GuideMeta;
    })
    .filter((g) => g.published)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
};

export const getGuideBySlug = (slug: string): GuideMeta | null =>
  getAllGuides().find((g) => g.slug === slug) ?? null;

export const getGuideComponent = (slug: string): ComponentType | null => {
  const entry = Object.entries(mdxModules).find(
    ([path]) => slugFromPath(path) === slug,
  );
  return entry ? entry[1].default : null;
};
