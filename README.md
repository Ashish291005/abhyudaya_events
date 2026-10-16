# Abhyudaya Events — Website & Admin

No dependencies to install. Requires Node.js 18+.

```bash
npm start
```

- Website: http://localhost:3000
- Admin panel: http://localhost:3000/admin

## First login
There is no built-in password. The admin login is created the first time the server starts
(stored, hashed, in `data/auth.json`, which is never committed):

- **Recommended:** set your own before the first start:
  ```bash
  ADMIN_USERNAME=admin ADMIN_PASSWORD='choose-a-strong-password' npm start
  ```
  (On Render/Railway/etc., add `ADMIN_PASSWORD` as an environment variable.)
- If `ADMIN_PASSWORD` is not set, a random password is generated and printed **once** in the server console.

`ADMIN_PASSWORD` is only read on the very first start. Afterwards, change the login from
Admin → Account & Backup. To reset a forgotten login, stop the server, delete `data/auth.json`,
and start it again with `ADMIN_PASSWORD` set.

## What's where
- `public/` – the public website (HTML/CSS/JS). `public/uploads/` holds images uploaded from the admin.
- `admin/` – the admin panel.
- `data/content.json` – all website content (edited via admin). A backup of the previous version is kept in `content.backup.json`.
- `data/enquiries.json` – contact-form submissions.
- `data/default-content.js` – seed content used only when `content.json` doesn't exist.

## Deploying
Any Node host with a persistent disk works (Render, Railway, a VPS, Hostinger Node hosting). Set `PORT` if needed,
and set `ADMIN_PASSWORD` before the first start.
Back up the `data/` and `public/uploads/` folders. Use HTTPS in production.
