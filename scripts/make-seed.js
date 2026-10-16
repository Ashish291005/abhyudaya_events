// Builds supabase/seed.sql (initial website content for Supabase) and
// public/content.sample.json (fallback used when Supabase isn't configured yet)
// from data/content.json.   Usage:  node scripts/make-seed.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const content = JSON.parse(fs.readFileSync(path.join(root, 'data', 'content.json'), 'utf8'));
delete content._rev; // the revision lives in its own column in Supabase

const json = JSON.stringify(content);
const tag = '$abhyudaya_seed$';
if (json.includes(tag)) throw new Error('content contains the SQL quote tag; pick another tag');

const sql = `-- Initial website content. Run once AFTER schema.sql (Supabase → SQL Editor).
-- It only inserts when no content exists yet, so it never overwrites edits made in the admin.
insert into public.site_content (id, data, rev)
values (1, ${tag}${json}${tag}::jsonb, 1)
on conflict (id) do nothing;
`;

fs.writeFileSync(path.join(root, 'supabase', 'seed.sql'), sql);
fs.writeFileSync(path.join(root, 'public', 'content.sample.json'), JSON.stringify(content, null, 2));
console.log('Wrote supabase/seed.sql and public/content.sample.json');
