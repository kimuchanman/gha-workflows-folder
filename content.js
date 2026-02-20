'use strict';

const PROCESSED = 'data-gha-folder-processed';

/**
 * Split a workflow name into folder path and display name.
 * e.g. "deploy/Production" -> { folder: "deploy", displayName: "Production" }
 * e.g. "CI"              -> { folder: null,     displayName: "CI" }
 */
function parseName(name) {
  const idx = name.indexOf('/');
  if (idx === -1) return { folder: null, displayName: name };
  return {
    folder: name.slice(0, idx),
    displayName: name.slice(idx + 1),
  };
}

/**
 * Update the visible text inside a cloned link element from fullName to displayName.
 * Walks all leaf <span> descendants first, then falls back to raw text nodes.
 */
function updateLinkText(link, fullName, displayName) {
  // Prefer a leaf <span> whose full text matches — GitHub wraps names this way
  for (const el of link.querySelectorAll('span')) {
    if (el.childElementCount === 0 && el.textContent.trim() === fullName) {
      el.textContent = displayName;
      return;
    }
  }
  // Fall back: find the first text node whose trimmed value matches exactly
  const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent.trim() === fullName) {
      node.textContent = node.textContent.replace(fullName, displayName);
      return;
    }
  }
}

/**
 * Build a <details> folder element containing cloned workflow links.
 */
function createFolderElement(folderName, items) {
  const details = document.createElement('details');
  details.className = 'gha-folder';
  details.open = true;

  const summary = document.createElement('summary');
  summary.className = 'gha-folder-summary';
  summary.textContent = folderName;
  details.appendChild(summary);

  const ul = document.createElement('ul');
  ul.className = 'gha-folder-children';

  for (const { link, originalName, displayName } of items) {
    const li = document.createElement('li');
    li.className = 'gha-folder-child';

    const clonedLink = link.cloneNode(true);
    clonedLink.setAttribute(PROCESSED, 'true');
    updateLinkText(clonedLink, originalName, displayName);

    li.appendChild(clonedLink);
    ul.appendChild(li);
  }

  details.appendChild(ul);
  return details;
}

function processPage() {
  if (!window.location.pathname.match(/\/[^/]+\/[^/]+\/actions/)) return;

  // Find unprocessed workflow links
  const links = Array.from(
    document.querySelectorAll(`a[href*="/actions/workflows/"]:not([${PROCESSED}])`)
  );
  if (links.length === 0) return;

  // Find the parent list that contains all workflow links
  const container = links[0].closest('ul, ol, [role="list"]');
  if (!container || container.getAttribute(PROCESSED)) return;

  // Collect only links that belong to this container
  const items = links
    .filter((link) => container.contains(link))
    .map((link) => {
      const name = link.textContent.trim();
      const { folder, displayName } = parseName(name);
      return { link, originalName: name, folder, displayName };
    });

  if (!items.some((item) => item.folder !== null)) return;

  // Mark as processed before mutating the DOM
  container.setAttribute(PROCESSED, 'true');
  items.forEach(({ link }) => link.setAttribute(PROCESSED, 'true'));

  // Group items by folder
  const folderMap = new Map();
  for (const item of items) {
    if (item.folder !== null) {
      if (!folderMap.has(item.folder)) folderMap.set(item.folder, []);
      folderMap.get(item.folder).push(item);
    }
  }

  // Find the first list-item that belongs to a folder (insertion point)
  let insertBefore = null;
  for (const child of container.children) {
    const a = child.querySelector(`a[href*="/actions/workflows/"]`);
    if (a && parseName(a.textContent.trim()).folder !== null) {
      insertBefore = child;
      break;
    }
  }

  // Insert folder elements and hide the original flat items
  for (const [folderName, folderItems] of folderMap) {
    const folderEl = createFolderElement(folderName, folderItems);
    container.insertBefore(folderEl, insertBefore);
  }

  for (const item of items) {
    if (item.folder !== null) {
      const li = item.link.closest('li') || item.link.parentElement;
      li.hidden = true;
    }
  }
}

// Reset processed markers when GitHub navigates to a new page (Turbo / pjax)
function resetAndProcess() {
  document.querySelectorAll(`[${PROCESSED}]`).forEach((el) => el.removeAttribute(PROCESSED));
  processPage();
}

// Observe DOM mutations to catch async rendering.
// Only schedule a re-process when the mutation actually adds workflow links.
let debounceTimer;
const observer = new MutationObserver((mutations) => {
  const relevant = mutations.some((m) =>
    Array.from(m.addedNodes).some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE &&
        (node.matches('a[href*="/actions/workflows/"]') ||
          node.querySelector('a[href*="/actions/workflows/"]'))
    )
  );
  if (!relevant) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(processPage, 200);
});

function init() {
  processPage();
  observer.observe(document.body, { childList: true, subtree: true });
}

// Handle Turbo (used by GitHub for SPA navigation)
document.addEventListener('turbo:render', resetAndProcess);
document.addEventListener('pjax:end', resetAndProcess);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
