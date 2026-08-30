# Issue tracker：GitHub

本仓库的 issues 和 specs 均存放于 GitHub Issues。所有操作使用 `gh` CLI。

## 约定

- **创建 issue**：`gh issue create --title "..." --body "..."`。多行正文使用 heredoc。
- **读取 issue**：`gh issue view <number> --comments`，通过 `jq` 过滤 comments，并同时获取 labels。
- **列出 issues**：`gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`，按需配合 `--label` 和 `--state` 过滤。
- **评论 issue**：`gh issue comment <number> --body "..."`
- **添加或移除 labels**：`gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **关闭 issue**：`gh issue close <number> --comment "..."`

从 `git remote -v` 推断仓库；在 clone 内执行时 `gh` 会自动完成该操作。

## PR 作为 triage 来源

**PRs as a request surface: no.** _(若本仓库将外部 PR 视为 feature requests，将其设为 `yes`；`/triage` 会读取此标记。)_

## 当 skill 要求 "publish to the issue tracker"

创建一个 GitHub issue。

## 当 skill 要求 "fetch the relevant ticket"

执行 `gh issue view <number> --comments`。

## Wayfinding 操作

供 `/wayfinder` 使用。**map** 是一个包含 Notes / Decisions-so-far / Fog 正文的单一 issue；**child** issues 是其 tickets。

- **Map**：创建并标记为 `wayfinder:map` 的单个 issue，执行 `gh issue create --label wayfinder:map`。
- **Child ticket**：通过 GitHub sub-issue 将 issue 关联到 map（使用 sub-issues endpoint 的 `gh api`）。若未启用 sub-issues，在 map 正文中添加 task list，并在 child 正文顶部写入 `Part of #<map>`。使用 `wayfinder:<type>` labels（`research`/`prototype`/`grilling`/`task`）；认领后将 ticket 分配给执行开发者。
- **Blocking**：使用 GitHub native issue dependencies。通过 `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>` 添加依赖，其中 `<blocker-db-id>` 是 blocker 的 numeric database id（`gh api repos/<owner>/<repo>/issues/<n> --jq .id`）。若不支持 dependencies，在 child 正文顶部加入 `Blocked by: #<n>, #<n>`。所有 blocker 关闭后，该 ticket 才解除阻塞。
- **Frontier query**：列出 map 的 open children，排除有 open blockers 或 assignee 的 issue，按 map 顺序选择第一个。
- **Claim**：执行 `gh issue edit <n> --add-assignee @me`。
- **Resolve**：执行 `gh issue comment <n> --body "<answer>"`，再执行 `gh issue close <n>`，最后将 context pointer 追加到 map 的 Decisions-so-far。
