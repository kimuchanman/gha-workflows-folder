現在のブランチから draft PR を作成してください。

手順:
1. `git status` と `git diff main...HEAD`（または適切なベースブランチ）で変更内容を確認
2. 変更内容を分析して PR タイトルと本文を作成
3. `gh pr create --draft` で draft PR を作成
4. 作成した PR の URL を表示

PR 本文はリポジトリの pull_request_template.md に従ってください。

引数 $ARGUMENTS が指定されていればベースブランチとして使用し、なければ main をベースにしてください。
