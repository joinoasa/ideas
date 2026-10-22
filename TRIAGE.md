# Sorting ideas

How an idea gets from the inbox onto the tech tree. People and AI assistants follow the same steps.

## 1. Read the idea and the tree

- Read the whole idea, including any linked discussion.
- Check the live tech tree: [joinoasa.org/techtree](https://joinoasa.org/techtree/) (the source is [`source/OASA-techtree.md`](https://github.com/joinoasa/website/blob/main/source/OASA-techtree.md) in the website repo).
- Search for nodes that already cover it. Search by what the idea *does*, not only by its name.

## 2. Pick one outcome

| If the idea… | Outcome |
|---|---|
| is already a node or moonshot | `on-tree` |
| adds detail, scope or a use to an existing node | `expands-node` |
| needs something the tree doesn't have | `new-node` |
| links nodes that aren't connected, or ties several into a moonshot | `connects-nodes` |
| is about how OASA runs (members, chapters, Academy, events, funding) | `operations` |
| is good but not ready (needs research, partners, or other nodes first) | `parked` |

If an idea does two things, pick the bigger one and mention the other in the note.

## 3. Make the change

- **on-tree:** nothing to change on the tree.
- **expands-node:** update the node's brief in [`source/techtree-details.json`](https://github.com/joinoasa/website/blob/main/source/techtree-details.json) (or its name in the tree doc) in a website pull request.
- **new-node:** add rows to the tree doc in a website pull request. Fill in ID, Node, Requires and Sciences, leave Unlocks as `—`, then run `npm run techtree:sync -- --write`. Add a brief for each new node to `techtree-details.json`. Follow the tree's rules: integrate before building, everything encrypted, piloted and autonomous, repairable.
- **connects-nodes:** edit the Requires column (or a moonshot's key nodes), then run the sync.
- **operations:** point to the place in the operations or concept doc that covers it, or note it for the founder.
- **parked:** say what would make it ready.

## 4. Record it on the idea

From a clone of this repo, with the GitHub CLI signed in:

```
node scripts/triage.mjs <idea number> <outcome> [node IDs] --note "one or two sentences" [--pr <pull request URL>]
```

Examples:

```
node scripts/triage.mjs 2 on-tree X-2
node scripts/triage.mjs 103 new-node T-SITE1,G-8,O-23 --note "Adds the landscaping robot chain." --pr https://github.com/joinoasa/website/pull/11
node scripts/triage.mjs 21 parked T-TSK1 --note "Candidate node under T-TSK1."
```

The script sets the outcome label, removes `needs-triage`, writes a **Where it landed** section into the idea (the website reads it to link ideas to nodes), comments, and closes the idea unless it's parked. Add `--dry-run` to see what it would do.

## Notes for AI assistants

- Stay in OASA's way of thinking: read the [core values](https://github.com/joinoasa/brand/tree/main/documents/core-values) and the [manifesto](https://github.com/joinoasa/brand/tree/main/documents/manifesto).
- Prefer existing nodes and standards over new ones. Reuse IDs exactly as they appear in the tree.
- New IDs take the next free number in the right prefix (`G-`, `M-`, `O-`, …). Never reuse or renumber an existing ID.
- Propose the change and the outcome to the person you're working with before running `triage.mjs` or opening a pull request.
