import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { defaultReadmePath, parseReadme } from "../src/lib/parse-readme";

describe("README catalog parser", () => {
  it("extracts the complete current catalog in source order", () => {
    const catalog = parseReadme(fs.readFileSync(defaultReadmePath, "utf8"));
    expect(catalog.categoryCount).toBe(20);
    expect(catalog.resourceCount).toBe(158);
    expect(catalog.resources[0]).toMatchObject({
      name: "SSD Replacement",
      category: "Guide",
      sourceOrder: 0,
    });
    expect(catalog.resources.at(-1)).toMatchObject({
      name: "Fan The Deck",
      category: "Podcast",
      sourceOrder: 157,
    });
  });

  it("supports reference links, GFM formatting, new categories, and duplicate occurrences", () => {
    const catalog = parseReadme(
      `# List\n\n## Contents\n- [Ignored](https://ignored.example) - ignored\n\n## New Category\n- [Same **name**][target] - A *formatted* description with ~~GFM~~.\n- [Same **name**][target] - The second occurrence.\n\n[target]: https://example.com/path\n`,
    );
    expect(catalog.categoryCount).toBe(1);
    expect(catalog.resourceCount).toBe(2);
    expect(catalog.resources[0].name).toBe("Same name");
    expect(catalog.resources[0].url).toBe("https://example.com/path");
    expect(catalog.resources[0].descriptionHtml).toContain(
      "<em>formatted</em>",
    );
    expect(catalog.resources[0].id).not.toBe(catalog.resources[1].id);
  });

  it.each([
    ["missing link", "## Tools\n- A plain entry - no link."],
    ["unsafe URL", "## Tools\n- [Bad](javascript:alert(1)) - unsafe."],
    [
      "missing description",
      "## Tools\n- [No description](https://example.com)",
    ],
  ])("reports %s with a source location", (_label, markdown) => {
    expect(() => parseReadme(markdown)).toThrow(/README\.md:\d+:\d+:/);
  });
});
