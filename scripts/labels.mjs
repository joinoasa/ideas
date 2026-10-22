// Creates or updates the ideas labels. Safe to re-run.
//   node scripts/labels.mjs [--dry-run]
import { REPO, gh } from './lib.mjs';

// Brand colors: navy 0B253A, steel 253A66, gold E3A32C, teal 2F968A, aluminum E5E8ED
export const LABELS = [
  { name: 'needs-triage', color: 'E3A32C', description: 'New idea, not sorted yet' },
  { name: 'outcome:on-tree', color: '2F968A', description: 'Already covered by a tech tree node' },
  { name: 'outcome:expands-node', color: '4FB3A6', description: 'Adds detail or scope to an existing node' },
  { name: 'outcome:new-node', color: '0B253A', description: 'Becomes one or more new tech tree nodes' },
  { name: 'outcome:connects-nodes', color: '253A66', description: 'Links existing nodes or ties them into a moonshot' },
  { name: 'outcome:operations', color: 'A9B3C1', description: 'About how OASA runs, not a technology' },
  { name: 'outcome:parked', color: 'E5E8ED', description: 'Good idea for later' },
  { name: 'from-discussions', color: 'C5CED9', description: 'Copied from the Ideas discussions' },
  { name: 'imported', color: 'C5CED9', description: 'Imported from the OASA roadmap Ideas Inbox' },
];

if (import.meta.url === `file://${process.argv[1]}`) {
  const dry = process.argv.includes('--dry-run');
  const existing = new Map();
  for (let page = 1; ; page++) {
    const batch = await gh(`repos/${REPO}/labels?per_page=100&page=${page}`);
    batch.forEach((l) => existing.set(l.name, l));
    if (batch.length < 100) break;
  }
  for (const l of LABELS) {
    const cur = existing.get(l.name);
    if (cur && cur.color.toLowerCase() === l.color.toLowerCase() && (cur.description || '') === l.description) continue;
    console.log(`${cur ? 'update' : 'create'} ${l.name}`);
    if (dry) continue;
    if (cur) await gh(`repos/${REPO}/labels/${encodeURIComponent(l.name)}`, { method: 'PATCH', body: { color: l.color, description: l.description } });
    else await gh(`repos/${REPO}/labels`, { method: 'POST', body: l });
  }
  console.log('labels: done');
}
