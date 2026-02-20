# gha-workflows-folder

GitHub Actions の Workflows で `name` に `/` を使っていると folder っぽく見えるようになる Chrome 拡張です。

## 概要

`.github/workflows/*.yml` の `name` フィールドに `/` を含めると、GitHub Actions のサイドバーでフォルダのようにグループ化して表示されます。

例:
```yaml
name: deploy/Production
```
↓ サイドバーでは `deploy` フォルダの中に `Production` として表示されます。

## インストール方法

1. このリポジトリをクローンまたは ZIP でダウンロードする
2. Chrome で `chrome://extensions` を開く
3. **デベロッパーモード** を有効にする
4. **パッケージ化されていない拡張機能を読み込む** をクリックし、リポジトリのディレクトリを選択する

## 使い方

インストール後、GitHub Actions ページ（`https://github.com/<owner>/<repo>/actions`）を開くと、`/` を含むワークフロー名が自動的にフォルダとしてグループ化されます。

- フォルダはクリックで折りたたみ / 展開できます
- フォルダ名は `/` より前の部分、ワークフロー名は `/` より後の部分になります

## ファイル構成

| ファイル | 説明 |
|---|---|
| `manifest.json` | Chrome 拡張マニフェスト (MV3) |
| `content.js` | GitHub Actions ページを変更するコンテンツスクリプト |
| `style.css` | フォルダ UI のスタイル |
