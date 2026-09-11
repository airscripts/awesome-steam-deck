import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  List,
  Root,
  ListItem,
  Paragraph,
  Definition,
  PhrasingContent,
} from "mdast";

import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { toString } from "mdast-util-to-string";

export interface Resource {
  id: string;
  url: string;
  name: string;
  domain: string;
  category: string;
  categoryId: string;
  sourceOrder: number;
  descriptionHtml: string;
  descriptionText: string;
  source: { line: number; column: number };
}

export interface Category {
  id: string;
  name: string;
  resources: Resource[];
}

export interface Catalog {
  resources: Resource[];
  resourceCount: number;
  categoryCount: number;
  categories: Category[];
}

const markdown = unified().use(remarkParse).use(remarkGfm);
const toHtml = unified().use(remarkRehype).use(rehypeStringify);

function isCatalogReadme(candidate: string): boolean {
  try {
    return fs
      .readFileSync(candidate, "utf8")
      .startsWith("# Awesome Steam Deck");
  } catch {
    return false;
  }
}

const readmeCandidates = [
  path.resolve(process.cwd(), "../README.md"),
  path.resolve(process.cwd(), "README.md"),
  fileURLToPath(new URL("../../../README.md", import.meta.url)),
  fileURLToPath(new URL("../../../../README.md", import.meta.url)),
];

export const defaultReadmePath =
  readmeCandidates.find(isCatalogReadme) ?? readmeCandidates[0];

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "category"
  );
}

type LocatedNode = {
  position?: { start?: { line?: number; column?: number } };
};

function errorAt(message: string, node: LocatedNode): Error {
  const position = node.position?.start;

  return new Error(
    `README.md:${position?.line ?? 1}:${position?.column ?? 1}: ${message}`,
  );
}

function renderDescription(nodes: PhrasingContent[]): {
  html: string;
  text: string;
} {
  const normalized = nodes.map((node, index) => {
    if (index !== 0 || node.type !== "text") return node;
    return { ...node, value: node.value.replace(/^\s*[-–—:]\s*/, "") };
  });

  const text = toString(normalized).trim();
  const root: Root = {
    type: "root",
    children: [{ type: "paragraph", children: normalized }],
  };

  const rendered = String(toHtml.stringify(toHtml.runSync(root)))
    .replace(/^<p>/, "")
    .replace(/<\/p>$/, "")
    .replace(/<a\b[^>]*>/g, "")
    .replace(/<\/a>/g, "");

  return { html: rendered, text };
}

function parseResource(
  item: ListItem,
  category: Category,
  sourceOrder: number,
  definitions: Map<string, Definition>,
): Resource {
  const paragraph = item.children.find(
    (child): child is Paragraph => child.type === "paragraph",
  );

  if (!paragraph)
    throw errorAt(
      "resource entry must contain a Markdown link and description",
      item,
    );

  const linkIndex = paragraph.children.findIndex(
    (child) => child.type === "link" || child.type === "linkReference",
  );

  const link = linkIndex >= 0 ? paragraph.children[linkIndex] : undefined;
  if (!link || (link.type !== "link" && link.type !== "linkReference"))
    throw errorAt("resource entry must start with a Markdown link", item);

  const name = toString(link).trim();
  if (!name) throw errorAt("resource name cannot be empty", link);

  const linkUrl =
    link.type === "link"
      ? link.url
      : definitions.get(link.identifier.toLowerCase())?.url;

  if (!linkUrl)
    throw errorAt(
      `reference link "${link.type === "linkReference" ? link.identifier : ""}" is not defined`,
      link,
    );

  let url: URL;
  try {
    url = new URL(linkUrl);
  } catch {
    throw errorAt(`invalid resource URL "${linkUrl}"`, link);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw errorAt(`unsafe resource URL scheme "${url.protocol}"`, link);
  }

  const descriptionNodes = paragraph.children.slice(
    linkIndex + 1,
  ) as PhrasingContent[];

  const description = renderDescription(descriptionNodes);
  if (!description.text)
    throw errorAt("resource description cannot be empty", item);

  const position = item.position?.start ?? { line: 1, column: 1 };

  return {
    name,
    sourceOrder,
    url: url.toString(),
    categoryId: category.id,
    category: category.name,
    descriptionHtml: description.html,
    descriptionText: description.text,
    id: `${category.id}-${sourceOrder}`,
    domain: url.hostname.replace(/^www\./, ""),
    source: { line: position.line, column: position.column },
  };
}

export function parseReadme(markdownText: string): Catalog {
  const tree = markdown.parse(markdownText) as Root;

  const definitions = new Map(
    tree.children
      .filter((node): node is Definition => node.type === "definition")
      .map((definition) => [definition.identifier.toLowerCase(), definition]),
  );

  const categories: Category[] = [];
  const resources: Resource[] = [];
  const byHeading = new Map<string, Category>();

  let current: Category | undefined;
  let sourceOrder = 0;

  for (const node of tree.children) {
    if (node.type === "heading" && node.depth === 2) {
      const name = toString(node).trim();

      if (name.toLowerCase() === "contents") {
        current = undefined;
        continue;
      }

      const id = slugify(name);
      current = byHeading.get(id);

      if (!current) {
        current = { id, name, resources: [] };
        byHeading.set(id, current);
        categories.push(current);
      }

      continue;
    }

    if (!current || node.type !== "list") continue;

    for (const item of (node as List).children) {
      const resource = parseResource(item, current, sourceOrder++, definitions);
      current.resources.push(resource);
      resources.push(resource);
    }
  }

  return {
    resources,
    categories,
    resourceCount: resources.length,
    categoryCount: categories.length,
  };
}

export function loadCatalog(readmePath = defaultReadmePath): Catalog {
  return parseReadme(fs.readFileSync(path.resolve(readmePath), "utf8"));
}
