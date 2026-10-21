(function () {
  "use strict";

  // Old (server-rendered) UI selectors
  const OLD_SEL = {
    nav: 'nav[aria-label="Actions Workflows"]',
    workflowItem: 'li[data-test-selector="workflow-rendered"]',
    label: ".ActionListItem-label",
    activeItem: ".ActionListItem--navActive",
    showMore: '[data-target="nav-list-group.showMoreItem"]',
  };

  // New (React/Primer) UI selectors
  const NEW_SEL = {
    nav: 'nav[aria-label="Actions workflows"]',
    group: '[data-component="ActionList.Group"]',
    groupHeading: '[data-component="ActionList.GroupHeading"]',
    item: '[data-component="ActionList.Item"]',
    label: '[data-component="ActionList.Item.Label"]',
    content: '[data-component="NavList.Item"]',
  };

  const CLASSES = {
    folderGroup: "ghawf-folder-group",
    expanded: "ghawf-expanded",
  };

  const ATTR_ORIGINAL_NAME = "data-ghawf-original-name";
  const ATTR_SHORT_NAME = "data-ghawf-short-name";

  let expandingAll = false;
  let labelObserver = null;

  function isActionsPage() {
    return /^\/[^/]+\/[^/]+\/actions(\/|$)/.test(location.pathname);
  }

  /**
   * Detect which UI is active and return the nav element.
   * Returns { nav, isNew } or null.
   */
  function detectUI() {
    const newNav = document.querySelector(NEW_SEL.nav);
    if (newNav && newNav.querySelector(NEW_SEL.group)) {
      return { nav: newNav, isNew: true };
    }
    const oldNav = document.querySelector(OLD_SEL.nav);
    if (oldNav) {
      return { nav: oldNav, isNew: false };
    }
    return null;
  }

  /**
   * Find the "Workflows" group list <ul> in the new React UI.
   */
  function findNewUIWorkflowList(nav) {
    const groups = nav.querySelectorAll(NEW_SEL.group);
    for (const group of groups) {
      const heading = group.querySelector(NEW_SEL.groupHeading);
      if (heading && heading.textContent.trim() === "Workflows") {
        return group.querySelector("ul");
      }
    }
    return null;
  }

  /**
   * Find the <ul> containing workflow items.
   */
  function findWorkflowList(nav, isNew) {
    if (isNew) {
      return findNewUIWorkflowList(nav);
    }
    const items = nav.querySelectorAll(OLD_SEL.workflowItem);
    if (items.length === 0) return null;
    return items[0].closest("ul");
  }

  /**
   * Get workflow <li> elements from the list.
   */
  function getWorkflowItems(ul, isNew) {
    if (isNew) {
      return Array.from(ul.querySelectorAll(`:scope > ${NEW_SEL.item}`));
    }
    return Array.from(ul.querySelectorAll(OLD_SEL.workflowItem));
  }

  /**
   * Get the label text from a workflow item.
   */
  function getLabel(item, isNew) {
    const el = item.querySelector(isNew ? NEW_SEL.label : OLD_SEL.label);
    return el ? el.textContent.trim() : null;
  }

  /**
   * Set the label text on a workflow item.
   */
  function setLabel(item, text, isNew) {
    const el = item.querySelector(isNew ? NEW_SEL.label : OLD_SEL.label);
    if (el) el.textContent = text;
  }

  /**
   * Check if a workflow item is the currently active one.
   */
  function isActiveItem(item, isNew) {
    if (isNew) {
      return item.getAttribute("data-active") === "true";
    }
    return item.querySelector(OLD_SEL.activeItem) !== null;
  }

  /**
   * Remove previous grouping, restoring original DOM state.
   */
  function cleanupPreviousGrouping(ul, isNew) {
    const folders = ul.querySelectorAll(`.${CLASSES.folderGroup}`);
    folders.forEach((folder) => {
      const children = folder.querySelector(".ghawf-folder-children");
      if (children) {
        Array.from(children.children).forEach((child) => {
          const originalName = child.getAttribute(ATTR_ORIGINAL_NAME);
          if (originalName) {
            setLabel(child, originalName, isNew);
          }
          child.removeAttribute(ATTR_ORIGINAL_NAME);
          child.removeAttribute(ATTR_SHORT_NAME);
          ul.insertBefore(child, folder);
        });
      }
      folder.remove();
    });
  }

  /**
   * Build a tree structure from workflow items.
   */
  function buildTree(items, isNew) {
    const folders = new Map();
    const ungrouped = [];

    items.forEach((item) => {
      const fullName = getLabel(item, isNew);
      if (!fullName) {
        ungrouped.push(item);
        return;
      }

      const slashIndex = fullName.indexOf("/");
      if (slashIndex <= 0 || slashIndex === fullName.length - 1) {
        ungrouped.push(item);
        return;
      }

      // Trim so "backend / Test" groups with "backend/Lint"
      const folderName = fullName.substring(0, slashIndex).trim();
      const shortName = fullName.substring(slashIndex + 1).trim();

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
  function createFolderElement(folderName, items, isNew) {
    const li = document.createElement("li");
    li.className = CLASSES.folderGroup;

    const hasActive = items.some((item) => isActiveItem(item.element, isNew));
    if (hasActive) {
      li.classList.add(CLASSES.expanded);
    }

    const button = document.createElement("button");
    button.className = "ghawf-folder-header";
    button.setAttribute("type", "button");

    const arrow = document.createElement("span");
    arrow.className = "ghawf-folder-arrow";
    arrow.textContent = "▶";

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

    const childUl = document.createElement("ul");
    childUl.className = "ghawf-folder-children";

    if (hasActive) {
      childUl.style.display = "block";
    }

    items.forEach(({ element, fullName, shortName }) => {
      element.setAttribute(ATTR_ORIGINAL_NAME, fullName);
      element.setAttribute(ATTR_SHORT_NAME, shortName);
      setLabel(element, shortName, isNew);
      childUl.appendChild(element);
    });

    li.appendChild(button);
    li.appendChild(childUl);

    return li;
  }

  /**
   * Core: apply folder grouping to the workflow list.
   */
  function applyGrouping(nav, isNew) {
    const ul = findWorkflowList(nav, isNew);
    if (!ul) return;

    if (labelObserver) {
      labelObserver.disconnect();
      labelObserver = null;
    }

    cleanupPreviousGrouping(ul, isNew);

    const items = getWorkflowItems(ul, isNew);
    if (items.length === 0) return;

    const { folders } = buildTree(items, isNew);
    if (folders.size === 0) return;

    const fragment = document.createDocumentFragment();
    for (const [folderName, folderItems] of folders) {
      fragment.appendChild(createFolderElement(folderName, folderItems, isNew));
    }
    ul.insertBefore(fragment, ul.firstChild);

    if (isNew) observeLabels(ul);
  }

  /**
   * New UI: React re-renders an item's content when its active state
   * changes (client-side navigation), which resets the label to the full
   * name. Restore the short name whenever that happens. Writing the same
   * text again triggers no further mutation, so this does not loop.
   */
  function observeLabels(ul) {
    labelObserver = new MutationObserver(() => {
      ul.querySelectorAll(`[${ATTR_SHORT_NAME}]`).forEach((item) => {
        const shortName = item.getAttribute(ATTR_SHORT_NAME);
        const label = item.querySelector(NEW_SEL.label);
        // Compare the raw text so the write always converges
        if (label && label.textContent !== shortName) {
          label.textContent = shortName;
        }
      });
    });
    labelObserver.observe(ul, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  // --- Old UI: fetch all via workflows_partial endpoint ---

  async function fetchAllWorkflowsOldUI(nav) {
    const showMoreEl = nav.querySelector(OLD_SEL.showMore);
    if (!showMoreEl) return;

    const totalPages = parseInt(
      showMoreEl.getAttribute("data-total-pages"),
      10
    );
    const currentPage = parseInt(
      showMoreEl.getAttribute("data-current-page"),
      10
    );
    if (!totalPages || totalPages <= currentPage) return;

    const baseSrc = showMoreEl.getAttribute("src");
    if (!baseSrc) return;

    const ul = findWorkflowList(nav, false);
    if (!ul) return;

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

    const parser = new DOMParser();
    for (const html of responses) {
      if (!html) continue;
      const doc = parser.parseFromString(html, "text/html");
      const items = doc.querySelectorAll(OLD_SEL.workflowItem);
      for (const item of items) {
        ul.appendChild(document.adoptNode(item));
      }
    }

    showMoreEl.hidden = true;
  }

  // --- New UI: click "Show more" button until all loaded ---

  function countNewUIItems(ul) {
    return ul.querySelectorAll(`:scope > ${NEW_SEL.item}`).length;
  }

  /**
   * Click "Show more" and wait until more workflow items are appended.
   * The button itself changes to "Loading workflows…" right after the
   * click, so any mutation is not a sign that loading finished.
   * Before React hydrates the sidebar, the server-rendered button ignores
   * clicks and nothing in the list changes. Resolves "ignored" then, so
   * the caller can click again.
   * Resolves "loaded", "ignored" or "timeout".
   */
  function clickAndWaitForMoreItems(ul, btn) {
    const countBefore = countNewUIItems(ul);
    return new Promise((resolve) => {
      let reacted = false;
      const observer = new MutationObserver(() => {
        reacted = true;
        if (countNewUIItems(ul) > countBefore) finish("loaded");
      });
      const ignoredTimer = setTimeout(() => {
        if (!reacted) finish("ignored");
      }, 1000);
      const timeoutTimer = setTimeout(() => finish("timeout"), 10000);
      function finish(result) {
        clearTimeout(ignoredTimer);
        clearTimeout(timeoutTimer);
        observer.disconnect();
        resolve(result);
      }
      // Observe before clicking so a synchronous re-render is not missed
      observer.observe(ul, {
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["data-loading"],
        subtree: true,
      });
      btn.click();
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function findShowMoreButton(ul) {
    const items = ul.children;
    for (let i = items.length - 1; i >= 0; i--) {
      const li = items[i];
      if (li.getAttribute("data-component") === "ActionList.Item") continue;
      const btn = li.querySelector("button");
      if (btn && btn.textContent.includes("Show more")) return btn;
    }
    return null;
  }

  async function fetchAllWorkflowsNewUI(nav) {
    const ul = findNewUIWorkflowList(nav);
    if (!ul) return;

    const maxAttempts = 100;
    const maxIgnored = 20;
    const maxTimeouts = 3;
    let ignored = 0;
    let timeouts = 0;
    for (let i = 0; i < maxAttempts; i++) {
      const btn = findShowMoreButton(ul);
      if (!btn) break;

      const result = await clickAndWaitForMoreItems(ul, btn);
      if (result === "ignored") {
        if (++ignored >= maxIgnored) break;
        await sleep(500);
      } else if (result === "timeout") {
        // Hydration may change the list right after an ignored click,
        // which looks like a reaction. Click again while the button is there.
        if (++timeouts >= maxTimeouts) break;
      }
    }
  }

  // --- Shared orchestration ---

  async function fetchAllWorkflows(nav, isNew) {
    if (isNew) {
      await fetchAllWorkflowsNewUI(nav);
    } else {
      await fetchAllWorkflowsOldUI(nav);
    }
  }

  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      if (expandingAll) return;

      for (const mutation of mutations) {
        if (mutation.type !== "childList" || mutation.addedNodes.length === 0)
          continue;

        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          if (
            node.matches?.(OLD_SEL.nav) ||
            node.querySelector?.(OLD_SEL.nav) ||
            node.matches?.(NEW_SEL.nav) ||
            node.querySelector?.(NEW_SEL.nav)
          ) {
            expandAllThenGroup();
            return;
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function expandAllThenGroup() {
    if (!isActionsPage()) return;
    if (expandingAll) return;
    expandingAll = true;
    try {
      const ui = detectUI();
      if (!ui) return;
      await fetchAllWorkflows(ui.nav, ui.isNew);
      applyGrouping(ui.nav, ui.isNew);
    } finally {
      expandingAll = false;
    }
  }

  function init() {
    expandAllThenGroup();
    setupObserver();

    document.addEventListener("turbo:load", () => expandAllThenGroup());
    document.addEventListener("turbo:frame-render", () =>
      expandAllThenGroup()
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
