---
description: Turn a markdown spec into Linear issues, resolving team/labels via the MCP server rather than guessing them here
argument-hint: "[spec-file]"
arguments: [spec_file]
allowed-tools: Read
disable-model-invocation: false
---

Read the spec at: $0

Pass its raw markdown content to the `committee_spec_to_linear` MCP tool (apps/mcp-server) —
don't parse it yourself or guess which Linear team/labels/project it belongs to; that
resolution lives in the server, not this prompt. Report back the issue keys the tool
created, and flag anything the tool couldn't confidently place (e.g. no matching team) for
you to resolve manually.
