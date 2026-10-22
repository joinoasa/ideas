// Copies new discussions from the org's Ideas category into this repo as numbered ideas.
// Each discussion is copied once (a marker in the idea's body remembers it).
// If DISCUSSIONS_TOKEN is set (a token that can comment on joinoasa/.github discussions),
// it also replies on the discussion with the idea's number.
//
//   node scripts/import-discussions.mjs [--dry-run]
import { REPO, gh, ideaId, allIssues, sleep, token } from './lib.mjs';

const SOURCE = process.env.DISCUSSIONS_REPO || 'joinoasa/.github';
const CATEGORY = (process.env.DISCUSSIONS_CATEGORY || 'ideas').toLowerCase();
const dry = process.argv.includes('--dry-run');
const [owner, name] = SOURCE.split('/');

async function graphql(query, variables, tokenValue) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenValue || token()}`, 'Content-Type': 'application/json', 'User-Agent': 'oasa-ideas' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GraphQL: ${res.status} ${JSON.stringify(json.errors || json)}`);
  return json.data;
}

const cats = await graphql(
  `query($owner:String!,$name:String!){ repository(owner:$owner,name:$name){ discussionCategories(first:50){ nodes{ id name slug } } } }`,
  { owner, name },
);
const category = cats.repository.discussionCategories.nodes.find(
  (c) => c.slug.toLowerCase() === CATEGORY || c.name.toLowerCase() === CATEGORY,
);
if (!category) { console.log(`No "${CATEGORY}" category in ${SOURCE}; nothing to do.`); process.exit(0); }

// Newest 100 discussions in the category is plenty for an hourly run.
const data = await graphql(
  `query($owner:String!,$name:String!,$cat:ID!){ repository(owner:$owner,name:$name){
     discussions(first:100, categoryId:$cat, orderBy:{field:CREATED_AT, direction:DESC}){
       nodes{ id number title url body createdAt author{ login } } } } }`,
  { owner, name, cat: category.id },
);
const discussions = data.repository.discussions.nodes;

const seen = new Set();
for (const issue of await allIssues()) {
  const m = String(issue.body || '').match(/<!-- discussion: (\S+) -->/);
  if (m) seen.add(m[1]);
}

const fresh = discussions.filter((d) => !seen.has(d.url)).reverse(); // oldest first, so numbers follow posting order
console.log(`${discussions.length} discussions in "${category.name}", ${fresh.length} new`);

for (const d of fresh) {
  const title = d.title.replace(/^\s*idea\s*:\s*/i, '').trim() || 'Untitled idea';
  const who = d.author ? `@${d.author.login}` : 'someone';
  const body = [
    `_Posted by ${who} in [Discussions](${d.url}). Talk it through there; this is its numbered copy._`,
    '',
    d.body || '',
    '',
    `<!-- discussion: ${d.url} -->`,
  ].join('\n');
  if (dry) { console.log(`would copy: ${d.url} — ${title}`); continue; }

  const issue = await gh(`repos/${REPO}/issues`, { method: 'POST', body: { title, body, labels: ['needs-triage', 'from-discussions'] } });
  // Issues created with the Actions token don't trigger other workflows, so number it here.
  await gh(`repos/${REPO}/issues/${issue.number}`, { method: 'PATCH', body: { title: `${ideaId(issue.number)}: ${title}` } });
  console.log(`${ideaId(issue.number)} ← ${d.url}`);

  if (process.env.DISCUSSIONS_TOKEN) {
    try {
      await graphql(
        `mutation($id:ID!,$body:String!){ addDiscussionComment(input:{discussionId:$id, body:$body}){ comment{ id } } }`,
        { id: d.id, body: `Thanks! This idea is now **${ideaId(issue.number)}**: ${issue.html_url}\nYou can follow where it lands on the tech tree there.` },
        process.env.DISCUSSIONS_TOKEN,
      );
    } catch (e) {
      console.log(`  (couldn't reply on the discussion: ${e.message.slice(0, 120)})`);
    }
  }
  await sleep(1500);
}
