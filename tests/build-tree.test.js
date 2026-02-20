import { describe, it, expect } from "vitest";

/**
 * Standalone reimplementation of buildTree logic for unit testing.
 * This mirrors the logic in content.js without DOM dependencies.
 */
function buildTree(items) {
  const folders = new Map();
  const ungrouped = [];

  items.forEach((item) => {
    const fullName = item.name;
    const slashIndex = fullName.indexOf("/");

    if (slashIndex <= 0 || slashIndex === fullName.length - 1) {
      ungrouped.push(item);
      return;
    }

    const folderName = fullName.substring(0, slashIndex);
    const shortName = fullName.substring(slashIndex + 1);

    if (!folders.has(folderName)) {
      folders.set(folderName, []);
    }
    folders.get(folderName).push({ ...item, fullName, shortName });
  });

  return { ungrouped, folders };
}

describe("buildTree", () => {
  it("groups items by first slash", () => {
    const items = [
      { name: "frontend/build" },
      { name: "frontend/lint" },
      { name: "backend/test" },
    ];
    const { ungrouped, folders } = buildTree(items);

    expect(ungrouped).toHaveLength(0);
    expect(folders.size).toBe(2);
    expect(folders.get("frontend")).toHaveLength(2);
    expect(folders.get("backend")).toHaveLength(1);
  });

  it("leaves items without slash ungrouped", () => {
    const items = [
      { name: "deploy" },
      { name: "frontend/build" },
      { name: "test-all" },
    ];
    const { ungrouped, folders } = buildTree(items);

    expect(ungrouped).toHaveLength(2);
    expect(ungrouped[0].name).toBe("deploy");
    expect(ungrouped[1].name).toBe("test-all");
    expect(folders.size).toBe(1);
  });

  it("splits only on first slash for deep paths", () => {
    const items = [{ name: "frontend/tests/unit" }];
    const { folders } = buildTree(items);

    expect(folders.size).toBe(1);
    expect(folders.get("frontend")[0].shortName).toBe("tests/unit");
  });

  it("does not group items starting with slash", () => {
    const items = [{ name: "/weird-name" }];
    const { ungrouped, folders } = buildTree(items);

    expect(ungrouped).toHaveLength(1);
    expect(folders.size).toBe(0);
  });

  it("does not group items ending with slash only", () => {
    const items = [{ name: "trailing/" }];
    const { ungrouped, folders } = buildTree(items);

    expect(ungrouped).toHaveLength(1);
    expect(folders.size).toBe(0);
  });

  it("handles .github/workflows prefix", () => {
    const items = [
      { name: ".github/workflows/cleanup.yml" },
      { name: ".github/workflows/deploy.yml" },
    ];
    const { folders } = buildTree(items);

    expect(folders.size).toBe(1);
    expect(folders.get(".github")).toHaveLength(2);
    expect(folders.get(".github")[0].shortName).toBe(
      "workflows/cleanup.yml"
    );
  });

  it("returns empty folders map when no items have slashes", () => {
    const items = [{ name: "build" }, { name: "test" }, { name: "deploy" }];
    const { ungrouped, folders } = buildTree(items);

    expect(ungrouped).toHaveLength(3);
    expect(folders.size).toBe(0);
  });

  it("handles single item in a folder", () => {
    const items = [{ name: "publish/libs" }];
    const { ungrouped, folders } = buildTree(items);

    expect(ungrouped).toHaveLength(0);
    expect(folders.size).toBe(1);
    expect(folders.get("publish")).toHaveLength(1);
  });

  it("handles empty input", () => {
    const { ungrouped, folders } = buildTree([]);

    expect(ungrouped).toHaveLength(0);
    expect(folders.size).toBe(0);
  });
});
