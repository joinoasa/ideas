# AGENTS.md: working in the OASA ideas repo

Read by AI coding agents (Claude Code, Codex, Cursor and others) and useful for people too. This repo is the **idea inbox**: each issue is one idea, and its issue number is its idea number (issue #42 is IDEA-0042).

## The two jobs

1. **Helping someone come up with an idea:** follow the [brainstorming guide](https://joinoasa.org/docs/brainstorm/). The person posts it with the idea form (the guide shows how to make a one-click link).
2. **Sorting posted ideas:** follow [TRIAGE.md](TRIAGE.md). Propose the outcome and any tree change to the person you're working with first, then record it with `node scripts/triage.mjs`.

## Rules for this repo

- **Don't open pull requests here unless you have to.** Pull requests share the issue counter, so each one uses up an idea number. Maintainers commit small file changes directly to `main`.
- **Never delete, renumber or retitle ideas** beyond what `number.yml` does. Never strip the `<!-- triage:… -->` or `<!-- discussion: … -->` markers; the website and the Discussions copy job rely on them.
- **Government-track ideas aren't posted here.** That work isn't published openly.
- Tree changes happen in [joinoasa/website](https://github.com/joinoasa/website) (`source/OASA-techtree.md`); see its AGENTS.md.

## Scripts

All need Node 20+ and a GitHub token (`gh auth login`, or `GH_TOKEN`). Add `--dry-run` to see what would happen.

| Command | What it does |
|---|---|
| `node scripts/triage.mjs <n> <outcome> [NODES] --note "…" [--pr URL]` | Record where an idea landed |
| `node scripts/first-look.mjs <n>` | Post the automatic "first look" comment (related nodes, similar ideas) |
| `node scripts/labels.mjs` | Create or update the labels |
| `node scripts/import-discussions.mjs` | Copy new Ideas discussions (runs hourly in Actions) |

Live data for checking ideas: [tree](https://joinoasa.org/data/techtree.json) and [ideas](https://joinoasa.org/data/ideas.json). Writing style: short, clear, not wordy.
