# gha-workflows-folder

GitHub Actions のワークフロー一覧サイドバーで、`/` を含む名前のワークフローを折りたたみ可能なフォルダにグループ化する Chrome 拡張。

## Before / After

| Before | After |
|--------|-------|
| `frontend/build` | **frontend/** (折りたたみ) |
| `frontend/lint` | ├ `build` |
| `frontend/test` | ├ `lint` |
| `publish/libs` | └ `test` |
| | **publish/** |
| | └ `libs` |

## 機能

- ワークフロー名の最初の `/` でフォルダ分割（`frontend/tests/unit` → フォルダ `frontend`、表示名 `tests/unit`）
- "Show more workflows..." を自動クリックして全ワークフローを読み込み
- フォルダの折りたたみ / 展開（アクティブなワークフローを含むフォルダは自動展開）
- SPA ナビゲーション対応（MutationObserver + Turbo イベント）
- GitHub Primer CSS 変数使用 → ライト / ダーク / ディム 全テーマ対応

## インストール

1. このリポジトリを clone
2. Chrome で `chrome://extensions` を開く
3. 「デベロッパーモード」を ON
4. 「パッケージ化されていない拡張機能を読み込む」からこのフォルダを選択

## 対象ページ

`https://github.com/*/*/actions*` にマッチするページで動作します。
