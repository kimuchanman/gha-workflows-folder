# gha-workflows-folder

A Chrome extension that turns the flat workflow list in the GitHub Actions sidebar into collapsible folders.

Name your workflows `frontend / build`, `frontend / lint`, `backend / test`, and the sidebar shows:

```text
▶ frontend  2
    build
    lint
▶ backend   1
    test
```

## Before / After

| Before | After |
|:--------:|:-------:|
| <img width="270" height="1161" alt="before_flat" src="https://github.com/user-attachments/assets/9a5f058a-93aa-431a-8b39-61b53c19b3b9" /> | <img width="268" height="1060" alt="after_folded" src="https://github.com/user-attachments/assets/39807dfb-40de-4464-bc41-cabf7a321e97" /> |

Click a folder to expand it:

<img width="267" height="1781" alt="after_expanded" src="https://github.com/user-attachments/assets/f636c4ce-b9f6-49c3-a0d8-59ede7c091df" />

## What it does

- **Groups by the first `/`.** `frontend/tests/unit` goes into the `frontend` folder and is shown as `tests/unit`. Spaces around the slash are ignored, so `frontend / build` and `frontend/lint` land in the same folder. Names without `/` stay in the list as they are, below the folders.
- **No more "Show more".** GitHub shows only the first part of the workflow list and hides the rest behind a "Show more" button. The extension loads every workflow when you open the Actions page, so all of them are sorted into folders without any clicks.
- **Opens the folder you are in.** The folder that contains the workflow you are viewing starts expanded. Other folders start collapsed.
- **Keeps working as you navigate.** Moving between workflows or into the Actions tab without a full page reload keeps the folders and short names.
- **Matches your theme.** Uses GitHub's own color variables, so light, dark and dim themes all look native.

The extension only changes how the sidebar is displayed. It does not change your workflows or send data outside GitHub.

## Install

1. Download `gha-workflows-folder-vX.Y.Z.zip` from the [latest release](https://github.com/kimuchanman/gha-workflows-folder/releases/latest).
2. Unzip it. You get a `gha-workflows-folder` folder.
3. Open `chrome://extensions` in Chrome.
4. Turn on **Developer mode** (top right).
5. Click **Load unpacked** and select the `gha-workflows-folder` folder.
6. Open any repository's **Actions** tab.

Keep the folder where it is. Chrome loads the extension from that folder, so deleting or moving it removes the extension.

### Update

1. Download the new zip and replace the old `gha-workflows-folder` folder with the new one.
2. Click the reload button (↻) on the extension's card in `chrome://extensions`.

## Naming your workflows

The folder comes from the `name:` at the top of each workflow file:

```yaml
# .github/workflows/frontend-build.yml
name: frontend / build
```

## Development

```sh
git clone https://github.com/kimuchanman/gha-workflows-folder.git
cd gha-workflows-folder
npm ci
npm run lint
npm test
```

Load the cloned folder with **Load unpacked** to try your changes.

### Releasing

1. Bump `version` in `manifest.json`.
2. Push a tag with the same version: `git tag v1.2.3 && git push origin v1.2.3`.

The Release workflow runs lint and tests, builds the zip with `npm run package`, and attaches it to a new GitHub Release.
