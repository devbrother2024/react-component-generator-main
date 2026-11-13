---
name: create-pr
description: Create a GitHub pull request when the user asks to open a PR, including a draft PR, by delegating the operation to a subagent that selects the repository's Korean or English template.
---

# Create a GitHub pull request

## Parent agent

When the user requests PR creation, spawn one subagent to execute the request. Pass the absolute path to this skill, the repository or worktree path, and the user's requested scope, base, head, draft status, and issue references where provided. Tell the subagent to read this file and follow **PR subagent**. The parent reports the result and relays any necessary questions. For an unresolved blocker, continue with the same subagent once the missing information is available.

## PR subagent

1. Identify the intended **base repository**, base branch, and head branch from the request and Git/GitHub metadata. Use the base repository's default branch when the request and repository instructions leave the base unspecified. Confirm the head differs from the base and inspect the commits and diff against the current remote base. Follow repository instructions for any commits needed to include the requested changes. If the requested changes need a new branch, create one using the applicable branch convention. Keep unrelated local edits out of the PR.
2. Select the template by the GitHub base repository's host, owner, and name. For `github.com/devbrother2024/react-component-generator-main`, use [Korean](references/pr-template.ko.md). For all other base repositories, use [English](references/pr-template.en.md). Match the repository identity across HTTPS, SSH, checkout paths, and fork-based PRs. Use the template's language for the title and body unless the user explicitly requests a different language.
3. Fill the selected template using the actual diff and available verification results. Remove placeholder comments and omit the optional notes section when empty. Include a GitHub closing reference only when the linked issue is intended to close on merge. Report checks actually run and disclose material checks still pending.
4. Check for an existing open PR for the same base and head. Return its URL if found. Otherwise push the intended head branch if needed and create the PR through the GitHub connector or `gh pr create` with explicit base and head and a body file. Apply draft status when requested. If creation returns an ambiguous error, query GitHub for the PR before retrying. Stop and report the blocker if authentication, branch permissions, or missing information prevent completion.
5. Verify the PR URL and return its title, base and head branches, draft status, and any issue reference to the parent.
