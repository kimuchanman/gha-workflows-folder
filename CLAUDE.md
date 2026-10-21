# CLAUDE.md

## Project Overview

GitHub Actions のワークフロー一覧サイドバーで、`/` を含むワークフロー名を折りたたみ可能なフォルダにグループ化する Chrome 拡張。
ビルドツール不要。プレーン JS + CSS のみ。

## File Structure

- `manifest.json` - Chrome Manifest V3
- `content.js` - メインロジック（DOM 操作 + MutationObserver + fetch）
- `content.css` - フォルダ UI スタイル（GitHub Primer CSS 変数使用）
- `icons/` - 拡張アイコン (16/48/128px)
- `eslint.config.js` - ESLint flat config（browser globals を手動定義）
- `.stylelintrc.json` - Stylelint 設定
- `tests/` - vitest ユニットテスト + manifest バリデーション

## Development Commands

- `npm run lint` - ESLint + Stylelint
- `npm run lint:js` - ESLint のみ
- `npm run lint:css` - Stylelint のみ
- `npm test` - vitest 実行
- `npm run validate:manifest` - manifest.json の構造チェック

## Key Conventions

- **No build step**: `content.js` はブラウザで直接実行される。ES Modules (`import`/`export`) は使えない
- **ESLint globals**: `content.js` で使うブラウザ API は `eslint.config.js` の `globals` に手動追加が必要
- **CSS**: GitHub Primer の CSS 変数（`--fgColor-default`, `--bgColor-neutral-muted` 等）を使い、全テーマ対応
- **CSS notation**: Stylelint が modern notation を要求する。`rgb(R G B / A%)` 形式を使うこと（`rgba()` は不可）
- **GitHub Actions の uses**: コミットハッシュに pin する（バックドア防止）。タグコメントを付記（例: `actions/checkout@<sha> # v4`）
- **テスト**: `content.js` は DOM 依存のため直接 import できない。テストではロジックを再実装してテストする
- **新旧 UI の両対応**: GitHub のサイドバーは React/Primer 版(新 UI)に移行済み。`content.js` は `detectUI()` で新旧を判定し、`isNew` で処理を分ける。旧 UI のコードは GHES 等のために残している
  - 新 UI: `nav[aria-label="Actions workflows"]` の中の、見出しが "Workflows" の `ActionList.Group` の `<ul>` が対象。項目は `[data-component="ActionList.Item"]`、active 判定は `data-active="true"`
  - 新 UI の "Show more" はボタンなので、クリックを繰り返して全件を表示する
  - 新 UI では React が active 切り替え時に項目の `<a>` を描き直し、ラベルがフル名に戻る。`observeLabels()` で短縮名に戻している

## Testing

動作確認は https://github.com/bm-sms/xuan/actions で行う。
`chrome://extensions` → デベロッパーモード → 「パッケージ化されていない拡張機能を読み込む」でこのフォルダを指定。

## GitHub Internal Endpoints

旧 UI でワークフロー全件取得に使用している非公開エンドポイント(新 UI では使わない):
- `GET /{owner}/{repo}/actions/workflows_partial?query=&page=N` - ワークフロー一覧の HTML パーシャル
  - "Show more" 要素の `src` 属性にベース URL、`data-total-pages` に総ページ数がある
  - `credentials: "include"` でセッション Cookie を使用（トークン不要）
