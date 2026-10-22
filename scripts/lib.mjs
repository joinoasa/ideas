// Shared helpers for the ideas scripts. No dependencies: Node 20+ (built-in fetch).
import { execFileSync } from 'node:child_process';

export const REPO = process.env.IDEAS_REPO || 'joinoasa/ideas';
export const TREE_URL = 'https://joinoasa.org/techtree/';

export const OUTCOMES = {
  'on-tree': 'On the tree',
  'expands-node': 'Expands a node',
  'new-node': 'New node',
  'connects-nodes': 'Connects nodes',
  operations: 'How OASA runs',
  parked: 'Parked',
};

// IDEA-0042
export const ideaId = (n) => `IDEA-${String(n).padStart(4, '0')}`;
// "IDEA-0042: Title" -> "Title"
export const stripPrefix = (title) => String(title || '').replace(/^\s*IDEA-\d+\s*[:·-]\s*/i, '').trim();

// Node IDs: R-COM2, T-SITE1, G-8, MS-7, ST-1 ...
export const NODE_RE = /^(?:R|T|A|L|G|S|U|X|M|O|I|C|SP|MS|ST)-[A-Z]*\d+$/;
export function parseNodes(text) {
  const nodes = String(text || '')
    .split(/[\s,]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const bad = nodes.filter((n) => !NODE_RE.test(n));
  if (bad.length) throw new Error(`Not a node ID: ${bad.join(', ')}`);
  return [...new Set(nodes)];
}

export function token() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
  } catch {
    throw new Error('No GitHub token. Sign in with `gh auth login`, or set GH_TOKEN.');
  }
}

export async function gh(path, { method = 'GET', body, tokenValue } = {}) {
  const res = await fetch(path.startsWith('http') ? path : `https://api.github.com/${path.replace(/^\//, '')}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'oasa-ideas',
      Authorization: `Bearer ${tokenValue || token()}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

// Every issue (not pull requests) in the repo, all states.
export async function allIssues() {
  const out = [];
  for (let page = 1; ; page++) {
    const batch = await gh(`repos/${REPO}/issues?state=all&per_page=100&page=${page}`);
    out.push(...batch.filter((i) => !i.pull_request));
    if (batch.length < 100) return out;
  }
}

// The "Where it landed" block written into an idea's body by triage.mjs.
const START = '<!-- triage:start -->';
const END = '<!-- triage:end -->';
const DATA_RE = /<!-- oasa-triage (\{.*?\}) -->/s;

export function triageBlock({ outcome, nodes = [], note = '', pr = '' }) {
  const links = nodes.map((n) => `[${n}](${TREE_URL}#${n})`).join(', ');
  const lines = [
    START,
    '## Where it landed',
    '',
    `**Outcome:** ${OUTCOMES[outcome]}`,
  ];
  if (links) lines.push('', `**Tech tree:** ${links}`);
  if (note) lines.push('', note);
  if (pr) lines.push('', `**Pull request:** ${pr}`);
  lines.push('', `<!-- oasa-triage ${JSON.stringify({ outcome, nodes, ...(pr ? { pr } : {}) })} -->`, END);
  return lines.join('\n');
}

export function setTriage(body, block) {
  const text = String(body || '');
  const re = new RegExp(`${START}[\\s\\S]*?${END}`);
  return re.test(text) ? text.replace(re, block) : `${text.trimEnd()}\n\n${block}\n`;
}

export function readTriage(body) {
  const m = String(body || '').match(DATA_RE);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
