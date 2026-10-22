// "First look" at a new idea: likely related tech tree nodes, similar ideas, and a check of any
// node IDs it mentions. Plain keyword matching, no AI. A starting point for sorting, not a decision.
//
//   node scripts/first-look.mjs <number> [--dry-run] [--force]
//
// Data comes from the live site (override with TREE_DATA / IDEAS_DATA: a URL or a local file path).
import { readFileSync } from 'node:fs';
import { REPO, gh, ideaId } from './lib.mjs';

const TREE_DATA = process.env.TREE_DATA || 'https://joinoasa.org/data/techtree.json';
const IDEAS_DATA = process.env.IDEAS_DATA || 'https://joinoasa.org/data/ideas.json';
const MARKER = '<!-- first-look -->';
const ID_RE = /\b(?:R|T|A|L|G|S|U|X|M|O|I|C|SP|MS|ST)-[A-Z]*\d+\b/g;

const STOP = new Set(`the and for with that this from into onto over under about than then they them their there these those
what when where which while would could should will shall can may might must have has had been being are was were not
but all any each every some more most much many such very just also only even our your you its it's who whom whose how
why use used using make makes made like need needs needed want one two three new idea ideas build built building way ways
get gets lets let off out per via etc it is be as at by of on or to in an a we us so do does done able thing things
something someone people person team system systems small little lot lots time help helps`.split(/\s+/));

const stem = (w) => w.replace(/(ies)$/, 'y').replace(/(sses)$/, 'ss').replace(/([^s])s$/, '$1');
export function tokens(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w))
    .map(stem);
}

async function load(src) {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src, { headers: { 'User-Agent': 'oasa-ideas' } });
    if (!res.ok) throw new Error(`${src}: ${res.status}`);
    return res.json();
  }
  return JSON.parse(readFileSync(src, 'utf8'));
}

/** Pure: build the first-look result for one idea. */
export function firstLook({ number, title, body }, tree, ideas) {
  const items = [
    ...tree.nodes.map((n) => ({ id: n.id, name: n.name, status: n.status, kind: 'node', name_t: tokens(n.name), rest_t: tokens(`${n.brief} ${n.sciences}`) })),
    ...tree.moonshots.map((m) => ({ id: m.id, name: m.title, kind: 'moonshot', name_t: tokens(m.title), rest_t: tokens(`${m.summary} ${m.brief}`) })),
  ];
  // Inverse document frequency, so rare words count more than common ones.
  const df = new Map();
  for (const it of items) for (const w of new Set([...it.name_t, ...it.rest_t])) df.set(w, (df.get(w) || 0) + 1);
  const idf = (w) => Math.log((items.length + 1) / ((df.get(w) || 0) + 1));

  const words = new Set(tokens(`${title} ${title} ${body}`));
  const scored = items.map((it) => {
    let s = 0;
    const hits = new Set();
    for (const w of new Set(it.name_t)) if (words.has(w)) { s += 2 * idf(w); hits.add(w); }
    for (const w of new Set(it.rest_t)) if (words.has(w) && !hits.has(w)) { s += idf(w); hits.add(w); }
    return { ...it, score: s, hits: [...hits] };
  }).filter((x) => x.score >= 4 && x.hits.length >= 2).sort((a, b) => b.score - a.score);
  const nodes = scored.filter((x) => x.kind === 'node').slice(0, 6);
  const moonshots = scored.filter((x) => x.kind === 'moonshot').slice(0, 2);

  // Node IDs the idea mentions, checked against the public tree.
  const known = new Map(items.map((x) => [x.id, x]));
  const mentioned = [...new Set((`${title}\n${body}`.replace(/<!--[\s\S]*?-->/g, '').match(ID_RE) || []))];
  const unknown = mentioned.filter((id) => !known.has(id));

  // Similar ideas: shared title words, plus nodes in common with what we found.
  const near = new Set([...nodes, ...moonshots].map((x) => x.id).concat(mentioned));
  const titleW = new Set(tokens(title));
  const similar = (ideas.ideas || []).filter((x) => x.id !== ideaId(number)).map((x) => {
    const tw = new Set(tokens(x.title));
    const shared = [...titleW].filter((w) => tw.has(w)).length;
    const overlap = (x.nodes || []).filter((n) => near.has(n)).length;
    return { ...x, shared, overlap, score: shared * 2 + overlap };
  }).filter((x) => x.shared >= 2 || (x.shared >= 1 && x.overlap >= 1) || x.overlap >= 2)
    .sort((a, b) => b.score - a.score).slice(0, 4);

  return { nodes, moonshots, mentioned, unknown, similar, known };
}

const STATUS = { available: 'ready', locked: 'locked', 'in-progress': 'in progress', done: 'done' };
const OUTCOME = { 'on-tree': 'on the tree', 'expands-node': 'expands a node', 'new-node': 'new node', 'connects-nodes': 'connects nodes', operations: 'how OASA runs', parked: 'parked' };
const link = (id, kind) => kind === 'moonshot' ? `https://joinoasa.org/moonshots/#${id}` : `https://joinoasa.org/techtree/#${id}`;
// "Site survey standard (OASA-SITE): one bundle…" -> "Site survey standard"
const short = (s) => String(s).split(/\s+\(|:\s/)[0].trim();
// The idea's own words: drop the triage section, import notes and hidden markers.
export const ideaText = (body) => String(body || '')
  .replace(/<!-- triage:start -->[\s\S]*?<!-- triage:end -->/g, ' ')
  .replace(/^_Imported from[^\n]*$/gm, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ');

export function render(r) {
  const out = ['**First look** (automatic keyword match: a starting point for sorting, not a decision)', ''];
  if (r.nodes.length || r.moonshots.length) {
    out.push('**Tech tree nodes that may be related:**');
    for (const n of r.nodes) out.push(`- [${n.id}](${link(n.id)}) ${short(n.name)} · ${STATUS[n.status] || n.status}`);
    for (const m of r.moonshots) out.push(`- [${m.id}](${link(m.id, 'moonshot')}) ${m.name} · moonshot`);
  } else {
    out.push('**No close matches on the tech tree.** It may be something new, or it uses different words; worth a search on the [tree](https://joinoasa.org/techtree/).');
  }
  if (r.similar.length) {
    out.push('', '**Similar ideas:**');
    for (const x of r.similar) out.push(`- [${x.id}](${x.url}) ${x.title}${x.outcome ? ` · ${OUTCOME[x.outcome] || x.outcome}` : ' · waiting'}`);
  }
  if (r.mentioned.length) {
    out.push('', `**Node IDs mentioned:** ${r.mentioned.map((id) => (r.known.has(id) ? `[${id}](${link(id, r.known.get(id).kind)}) ✓` : `${id} (not on the tree)`)).join(', ')}`);
  }
  out.push('', 'Sorting guide: [TRIAGE.md](https://github.com/joinoasa/ideas/blob/main/TRIAGE.md)', MARKER);
  return out.join('\n');
}

/** Post (or, with dry, print) the first look for an idea. Skips if one is already there unless force. */
export async function postFirstLook(number, { dry = false, force = false, tree, ideas } = {}) {
  const issue = await gh(`repos/${REPO}/issues/${number}`);
  if (issue.pull_request) return console.log(`#${number} is a pull request; skipped`);
  if (!force) {
    const comments = await gh(`repos/${REPO}/issues/${number}/comments?per_page=100`);
    if (comments.some((c) => (c.body || '').includes(MARKER))) return console.log(`${ideaId(number)} already has a first look; skipped`);
  }
  tree ??= await load(TREE_DATA);
  ideas ??= await load(IDEAS_DATA);
  const body = render(firstLook({ number, title: issue.title.replace(/^IDEA-\d+:\s*/, ''), body: ideaText(issue.body) }, tree, ideas));
  if (dry) return console.log(`--- ${ideaId(number)} ---\n${body}\n`);
  await gh(`repos/${REPO}/issues/${number}/comments`, { method: 'POST', body: { body } });
  console.log(`${ideaId(number)}: first look posted`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const nums = args.filter((a) => /^\d+$/.test(a)).map(Number);
  if (!nums.length) { console.error('Usage: node scripts/first-look.mjs <number> [more numbers] [--dry-run] [--force]'); process.exit(1); }
  try {
    const tree = await load(TREE_DATA);
    const ideas = await load(IDEAS_DATA);
    for (const n of nums) await postFirstLook(n, { dry: args.includes('--dry-run'), force: args.includes('--force'), tree, ideas });
  } catch (e) {
    // In Actions, ::error:: shows the reason on the run page.
    console.error(process.env.GITHUB_ACTIONS ? `::error::${e.message.replace(/\n/g, ' ')}` : e.message);
    process.exit(1);
  }
}
