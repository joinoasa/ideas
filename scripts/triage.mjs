// Records where an idea landed: outcome label, linked nodes, a "Where it landed" section, a comment,
// and closes the idea (parked ideas stay open). See TRIAGE.md.
//
//   node scripts/triage.mjs <number> <outcome> [NODE,NODE] [--note "text"] [--pr URL] [--dry-run]
//   outcomes: on-tree, expands-node, new-node, connects-nodes, operations, parked
import { REPO, OUTCOMES, gh, ideaId, parseNodes, triageBlock, setTriage } from './lib.mjs';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  if (i === -1) return '';
  const v = args[i + 1];
  args.splice(i, 2);
  return v || '';
};
const dry = args.includes('--dry-run');
if (dry) args.splice(args.indexOf('--dry-run'), 1);
const note = flag('--note');
const pr = flag('--pr');
const [numArg, outcome, nodesArg = ''] = args;

const usage = 'Usage: node scripts/triage.mjs <number> <outcome> [NODE,NODE] [--note "text"] [--pr URL] [--dry-run]';
const number = Number(String(numArg || '').replace(/^IDEA-0*/i, ''));
if (!Number.isInteger(number) || number < 1) { console.error(usage); process.exit(1); }
if (!OUTCOMES[outcome]) { console.error(`Outcome must be one of: ${Object.keys(OUTCOMES).join(', ')}`); process.exit(1); }
const nodes = parseNodes(nodesArg);
if (['on-tree', 'expands-node', 'new-node', 'connects-nodes'].includes(outcome) && !nodes.length) {
  console.error(`"${outcome}" needs at least one node ID.`); process.exit(1);
}
if (pr && !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+$/.test(pr)) { console.error('--pr must be a GitHub pull request URL'); process.exit(1); }

const issue = await gh(`repos/${REPO}/issues/${number}`);
if (issue.pull_request) { console.error(`#${number} is a pull request, not an idea.`); process.exit(1); }

const labels = issue.labels.map((l) => l.name).filter((n) => !n.startsWith('outcome:') && n !== 'needs-triage');
labels.push(`outcome:${outcome}`);
const body = setTriage(issue.body, triageBlock({ outcome, nodes, note, pr }));
const state = outcome === 'parked' ? 'open' : 'closed';
const comment = [
  `Sorted: **${OUTCOMES[outcome]}**.`,
  nodes.length ? `Tech tree: ${nodes.map((n) => `[${n}](https://joinoasa.org/techtree/#${n})`).join(', ')}` : '',
  note,
  pr ? `Pull request: ${pr}` : '',
  outcome === 'parked' ? 'Parked ideas stay open, so anyone can pick them up later.' : '',
].filter(Boolean).join('\n\n');

console.log(`${ideaId(number)} → ${outcome}${nodes.length ? ` (${nodes.join(', ')})` : ''}; ${state}`);
if (dry) { console.log('\n--- comment ---\n' + comment); process.exit(0); }

await gh(`repos/${REPO}/issues/${number}`, {
  method: 'PATCH',
  body: { body, labels, state, ...(state === 'closed' ? { state_reason: 'completed' } : {}) },
});
await gh(`repos/${REPO}/issues/${number}/comments`, { method: 'POST', body: { body: comment } });
console.log('done:', issue.html_url);
