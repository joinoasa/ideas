// One-time import of the OASA roadmap Ideas Inbox (data/roadmap-import.json) as IDEA-0001 onward.
// Issue numbers must line up with idea numbers, so it refuses to run unless the repo's next
// number is exactly the next idea's number. Safe to re-run: it resumes after the last imported idea.
// Government-track ideas were left out on purpose (they aren't published openly).
//
//   node scripts/import-roadmap.mjs [--dry-run]
import { readFileSync } from 'node:fs';
import { REPO, gh, ideaId, triageBlock, sleep } from './lib.mjs';

const dry = process.argv.includes('--dry-run');
const { ideas } = JSON.parse(readFileSync(new URL('../data/roadmap-import.json', import.meta.url), 'utf8'));
const PR = { 'new-node': 'https://github.com/joinoasa/website/pull/11' };
const STAY_OPEN = new Set(['AI brainstorming guide']); // still being built

// Highest number used so far by an issue or pull request (they share one counter).
async function lastNumber() {
  const [i] = await gh(`repos/${REPO}/issues?state=all&per_page=1&sort=created&direction=desc`);
  const [p] = await gh(`repos/${REPO}/pulls?state=all&per_page=1&sort=created&direction=desc`);
  return Math.max(i?.number || 0, p?.number || 0);
}

let last = await lastNumber();
const todo = ideas.filter((x) => x.n > last);
console.log(`repo at #${last}; ${todo.length} ideas to import`);
if (todo.length && todo[0].n !== last + 1) {
  console.error(`Next issue would be #${last + 1}, but the next idea is ${ideaId(todo[0].n)}. Stopping so numbers don't drift.`);
  process.exit(1);
}

for (const x of todo) {
  const pr = PR[x.outcome] || '';
  const body = [
    `_Imported from the OASA roadmap Ideas Inbox. First noted ${x.date}._`,
    '',
    '### The idea',
    '',
    x.notes,
    '',
    triageBlock({ outcome: x.outcome, nodes: x.nodes, note: x.note, pr }),
    '',
  ].join('\n');
  const title = `${ideaId(x.n)}: ${x.title}`;
  if (dry) { console.log(`would create ${title} [${x.outcome}]`); continue; }

  const issue = await gh(`repos/${REPO}/issues`, { method: 'POST', body: { title, body, labels: ['imported', `outcome:${x.outcome}`] } });
  if (issue.number !== x.n) {
    console.error(`Created #${issue.number} for ${ideaId(x.n)}. Numbers drifted; stopping. Fix by hand before re-running.`);
    process.exit(1);
  }
  const open = x.outcome === 'parked' || STAY_OPEN.has(x.title);
  if (!open) await gh(`repos/${REPO}/issues/${issue.number}`, { method: 'PATCH', body: { state: 'closed', state_reason: 'completed' } });
  console.log(`${ideaId(x.n)} ${open ? 'open  ' : 'closed'} ${x.outcome.padEnd(14)} ${x.title}`);
  await sleep(2500); // stay well under GitHub's content-creation limits
}
console.log('import: done');
