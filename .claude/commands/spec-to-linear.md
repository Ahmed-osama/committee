---
description: Turn a markdown spec into Linear issues, resolving team/labels via the MCP server rather than guessing them here
argument-hint: "[spec-file]"
arguments: [spec_file]
allowed-tools: Read, mcp__committee__committee_resolve_linear_target, mcp__linear__save_issue, mcp__linear__save_project
disable-model-invocation: false
---

Read the spec at: $0

1. Extract a one-line summary (title + gist) of the spec.
2. Call `committee_resolve_linear_target` with that summary — don't guess the Linear
   team/labels/project yourself, that resolution lives in the server config, not this
   prompt.
3. If `project` comes back non-null, break the spec into discrete work items and file
   each with `mcp__linear__save_issue` under that team/project (and labels, if any).
4. If `project` comes back `null` (no confident match), stop and ask the user whether
   this is a new initiative — if so, create one project via `mcp__linear__save_project`
   first (this workspace's convention is one project/Epic per initiative — see
   `project_linear_epic_convention`), then file issues under it. Don't file loose
   top-level issues.

Report back the issue keys created (and the project, if newly created).
