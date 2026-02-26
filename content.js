(function () {
  "use strict";

  const SELECTORS = {
    nav: 'nav[aria-label="Actions Workflows"]',
    workflowItem: 'li[data-test-selector="workflow-rendered"]',
    label: ".ActionListItem-label",
    activeItem: ".ActionListItem--navActive",
    showMore: '[data-target="nav-list-group.showMoreItem"]',
  };

  const CLASSES = {
    folderGroup: "ghawf-folder-group",
    expanded: "ghawf-expanded",
  };

  const ATTR_ORIGINAL_NAME = "data-ghawf-original-name";

  let expandingAll = false;

  /**
   * Check if the current page is a GitHub Actions page.
   */
  function isActionsPage() {
    return /^\/[^/]+\/[^/]+\/actions(\/|$)/.test(location.pathname);
  }

  /**
   * Find the <ul> containing workflow items inside the nav.
   */
  function findWorkflowList() {
    const nav = document.querySelector(SELECTORS.nav);
    if (!nav) return null;

    const items = nav.querySelectorAll(SELECTORS.workflowItem);
    if (items.length === 0) return null;

    return items[0].closest("ul");
  }

  /**
   * Remove previous grouping, restoring original DOM state.
   */
  function cleanupPreviousGrouping(ul) {
    const folders = ul.querySelectorAll(`.${CLASSES.folderGroup}`);
    folders.forEach((folder) => {
      const children = folder.querySelector(".ghawf-folder-children");
      if (children) {
        Array.from(children.children).forEach((child) => {
          // Restore original label text
          const label = child.querySelector(SELECTORS.label);
          const originalName = child.getAttribute(ATTR_ORIGINAL_NAME);
          if (label && originalName) {
            label.textContent = originalName;
          }
          child.removeAttribute(ATTR_ORIGINAL_NAME);
          ul.insertBefore(child, folder);
        });
      }
      folder.remove();
    });
  }

  /**
   * Build a tree structure from workflow items.
   * Splits only on the first `/`.
   * Returns { ungrouped: [...items], folders: Map<string, [...items]> }
   */
  function buildTree(items) {
    const folders = new Map();
    const ungrouped = [];

    items.forEach((item) => {
      const label = item.querySelector(SELECTORS.label);
      if (!label) {
        ungrouped.push(item);
        return;
      }

      const fullName = label.textContent.trim();
      const slashIndex = fullName.indexOf("/");

      // No slash, or starts with slash, or ends with slash only → don't group
      if (slashIndex <= 0 || slashIndex === fullName.length - 1) {
        ungrouped.push(item);
        return;
      }

      const folderName = fullName.substring(0, slashIndex);
      const shortName = fullName.substring(slashIndex + 1);

      if (!folders.has(folderName)) {
        folders.set(folderName, []);
      }
      folders.get(folderName).push({ element: item, fullName, shortName });
    });

    return { ungrouped, folders };
  }

  /**
   * Create a folder <li> element with collapsible children.
   */
  function createFolderElement(folderName, items) {
    const li = document.createElement("li");
    li.className = CLASSES.folderGroup;

    // Check if any child is active
    const hasActive = items.some(
      (item) => item.element.querySelector(SELECTORS.activeItem) !== null
    );
    if (hasActive) {
      li.classList.add(CLASSES.expanded);
    }

    // Header button
    const button = document.createElement("button");
    button.className = "ghawf-folder-header";
    button.setAttribute("type", "button");

    const arrow = document.createElement("span");
    arrow.className = "ghawf-folder-arrow";
    arrow.textContent = "\u25B6";

    const name = document.createElement("span");
    name.className = "ghawf-folder-name";
    name.textContent = folderName;

    const count = document.createElement("span");
    count.className = "ghawf-folder-count";
    count.textContent = items.length;

    button.appendChild(arrow);
    button.appendChild(name);
    button.appendChild(count);

    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isExpanded = li.classList.toggle(CLASSES.expanded);
      childUl.style.display = isExpanded ? "block" : "none";
    });

    // Children list
    const childUl = document.createElement("ul");
    childUl.className = "ghawf-folder-children";

    // Set initial display based on expanded state
    if (hasActive) {
      childUl.style.display = "block";
    }

    items.forEach(({ element, fullName, shortName }) => {
      element.setAttribute(ATTR_ORIGINAL_NAME, fullName);
      const label = element.querySelector(SELECTORS.label);
      if (label) {
        label.textContent = shortName;
      }
      childUl.appendChild(element);
    });

    li.appendChild(button);
    li.appendChild(childUl);

    return li;
  }

  /**
   * Core: apply folder grouping to the workflow list.
   */
  function applyGrouping() {
    const ul = findWorkflowList();
    if (!ul) return;

    cleanupPreviousGrouping(ul);

    const items = Array.from(ul.querySelectorAll(SELECTORS.workflowItem));
    if (items.length === 0) return;

    const { folders } = buildTree(items);
    if (folders.size === 0) return;

    // Insert folders at the top of the list, before the first workflow item.
    // Ungrouped items remain in their original positions below.
    const firstItem = ul.querySelector(SELECTORS.workflowItem);

    for (const [folderName, folderItems] of folders) {
      const folderEl = createFolderElement(folderName, folderItems);
      ul.insertBefore(folderEl, firstItem);
    }
  }

  /**
   * Fetch all remaining workflow pages via the workflows_partial endpoint
   * and insert items into the DOM. Much faster than clicking "Show more"
   * repeatedly since all pages are fetched in parallel.
   */
  async function fetchAllWorkflows() {
    const nav = document.querySelector(SELECTORS.nav);
    if (!nav) return;

    const showMoreEl = nav.querySelector(SELECTORS.showMore);
    if (!showMoreEl) return;

    const totalPages = parseInt(showMoreEl.getAttribute("data-total-pages"), 10);
    const currentPage = parseInt(showMoreEl.getAttribute("data-current-page"), 10);
    if (!totalPages || totalPages <= currentPage) return;

    // src attribute contains the base URL, e.g. "/{owner}/{repo}/actions/workflows_partial?query="
    const baseSrc = showMoreEl.getAttribute("src");
    if (!baseSrc) return;

    const ul = findWorkflowList();
    if (!ul) return;

    // Fetch all remaining pages in parallel
    const pages = [];
    for (let page = currentPage + 1; page <= totalPages; page++) {
      pages.push(page);
    }

    const responses = await Promise.all(
      pages.map((page) =>
        fetch(`${baseSrc}&page=${page}`, {
          headers: { Accept: "text/html" },
          credentials: "include",
        }).then((r) => (r.ok ? r.text() : ""))
      )
    );

    // Parse each response and insert workflow items into the list
    const parser = new DOMParser();
    for (const html of responses) {
      if (!html) continue;
      const doc = parser.parseFromString(html, "text/html");
      const items = doc.querySelectorAll(SELECTORS.workflowItem);
      for (const item of items) {
        ul.appendChild(document.adoptNode(item));
      }
    }

    // Hide the "Show more" button since all items are now loaded
    showMoreEl.hidden = true;
  }

  /**
   * Set up MutationObserver for SPA navigation.
   * While expandingAll is true, skip re-grouping (handled by expandAllThenGroup).
   */
  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      if (expandingAll) return;

      for (const mutation of mutations) {
        if (mutation.type !== "childList" || mutation.addedNodes.length === 0)
          continue;

        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          // New nav appeared (SPA navigation) → full expand + group
          if (
            node.matches?.(SELECTORS.nav) ||
            node.querySelector?.(SELECTORS.nav)
          ) {
            expandAllThenGroup();
            return;
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Expand all then apply grouping. Prevents MutationObserver from
   * running applyGrouping on every "Show more" batch while we're still loading.
   */
  async function expandAllThenGroup() {
    if (!isActionsPage()) return;
    if (expandingAll) return;
    expandingAll = true;
    try {
      await fetchAllWorkflows();
      applyGrouping();
    } finally {
      expandingAll = false;
    }
  }

  /**
   * Entry point.
   */
  function init() {
    expandAllThenGroup();
    setupObserver();

    // Supplementary: Turbo events for SPA navigation
    document.addEventListener("turbo:load", () => expandAllThenGroup());
    document.addEventListener("turbo:frame-render", () => expandAllThenGroup());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
