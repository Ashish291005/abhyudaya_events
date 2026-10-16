# Abhyudaya Events — Website & Admin

A static website + admin panel, hosted on **Vercel**, with all data in **Supabase**
(database, admin login, and file storage). No build step and no npm packages.

```
public/            everything Vercel serves
  index.html, app.js, style.css    the website
  admin/                           the admin panel (/admin)
  config.js                        Supabase URL + public anon key
  content.sample.json              fallback content when Supabase isn't configured
supabase/
  schema.sql       tables + security rules (run once)
  seed.sql         initial website content (run once)
scripts/make-seed.js   rebuilds seed.sql from data/content.json
vercel.json        hosting config + security headers
server.js          local preview server (not used on Vercel)
```

## How the admin is secured

- **No password ever reaches the browser.** Login uses Supabase Auth: the password is sent over
  HTTPS to Supabase, checked there against a salted hash, and rate-limited. Inspect/DevTools only
  ever shows the public URL and the public *anon* key, which are meant to be public.
- **The database enforces who can do what** (row-level security in `supabase/schema.sql`):
  - visitors can only *read* website content and *submit* an enquiry. They can never read enquiries;
  - only accounts listed in the `admins` table can save content, manage enquiries or upload files.
    A valid login that isn't on that list gets nothing;
  - saves are refused if another admin saved newer content in the meantime, and the last 50
    versions are kept in `content_history`.
- Admin sessions live only in the browser tab (closing the browser signs out), and
  *Account & Backup → Sign out of all devices* revokes every session.
- Strict security headers on Vercel: scripts only from this site, no framing, no indexing of `/admin`.
- **Never** put the `service_role` (secret) key in this project.

## 1. Set up Supabase (one time)

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**: paste all of `supabase/schema.sql` → **Run**.
3. **SQL Editor → New query**: paste all of `supabase/seed.sql` → **Run** (loads the current website content).
4. **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up".
5. **Authentication → Users → Add user → Create new user**: your admin email + a strong password
   (12+ characters), tick **Auto Confirm User**.
6. **SQL Editor**: make that user an admin (use your email):
   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'you@example.com';
   ```
7. **Project Settings → API**: copy the **Project URL** and the **anon / publishable** key into
   `public/config.js`.

To add another admin later, repeat steps 5–6. To remove one:
`delete from public.admins where email = 'them@example.com';`

## 2. Run locally

```bash
npm start
```

Website: http://localhost:3000 · Admin: http://localhost:3000/admin

## 3. Deploy on Vercel

1. [vercel.com/new](https://vercel.com/new) → import the GitHub repo.
2. Framework preset: **Other**. Leave build/install commands empty (they come from `vercel.json`).
3. Deploy. Every push to `main` redeploys automatically.
4. In Supabase → **Authentication → URL Configuration**, set the **Site URL** to your Vercel domain.

## Updating the starter content

`data/content.json` is only the starting point. Once Supabase is set up, edit everything in the admin.
If you change `data/content.json`, run `node scripts/make-seed.js` to rebuild `supabase/seed.sql`.
