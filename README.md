# OASA ideas

The idea inbox for the [Open Autonomous Systems Alliance](https://joinoasa.org). Every idea gets a number (**IDEA-0001**, **IDEA-0002** and so on), then a home on the [tech tree](https://joinoasa.org/techtree/).

Anyone can post an idea. You don't need to be a member.

## Post an idea

- **Here:** [open the idea form](https://github.com/joinoasa/ideas/issues/new?template=idea.yml). It takes a few minutes.
- **In Discussions:** start a post in the [Ideas category](https://github.com/orgs/joinoasa/discussions/categories/ideas). It's copied here within the hour and gets its own number.
- **With your AI:** point any AI assistant at the [brainstorming guide](https://joinoasa.org/docs/brainstorm/), then paste what it produces into the form.

Your idea's number is its issue number, so IDEA-0042 is issue #42. (Now and then a number is skipped, because pull requests share the same counter.)

## What happens next

Every idea gets sorted into one outcome, shown as a label:

| Outcome | Label | What it means |
|---|---|---|
| On the tree | `outcome:on-tree` | It's already covered. The idea is linked to the node and closed. |
| Expands a node | `outcome:expands-node` | It adds detail or scope to a node that exists. The node is updated and links back here. |
| New node | `outcome:new-node` | It becomes one or more new nodes on the tech tree. |
| Connects nodes | `outcome:connects-nodes` | It links nodes that weren't connected, or ties them together in a moonshot. |
| How OASA runs | `outcome:operations` | It's about the alliance itself (membership, chapters, Academy, events), not a technology. |
| Parked | `outcome:parked` | A good idea for later. It stays open. |

New ideas carry `needs-triage` until they're sorted. Once an idea is sorted, the tech tree nodes it touches list it, so anyone can see which ideas a node grew from.

**Who sorts:** the founder for now, then project leads. People and their AI assistants follow the same steps in [TRIAGE.md](TRIAGE.md).

## What's in this repo

| Path | What it is |
|---|---|
| `.github/ISSUE_TEMPLATE/idea.yml` | The idea form |
| `.github/workflows/number.yml` | Puts the IDEA number in each title and marks new ideas `needs-triage` |
| `.github/workflows/discussions.yml` | Copies new Ideas discussions here every hour |
| `scripts/triage.mjs` | Records an outcome on an idea (labels, linked nodes, comment) |
| `scripts/labels.mjs` | Creates or updates the labels |
| `scripts/import-discussions.mjs` | The Discussions copy step |
| `data/roadmap-import.json` | The first ideas, imported from the OASA roadmap |

## License

Idea text is shared under [CC BY-SA 4.0](LICENSE-content). Scripts are [Apache-2.0](LICENSE). The OASA name and logo are not covered by either license.
