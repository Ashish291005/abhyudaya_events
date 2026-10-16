# Abhyudaya Events — Website & Admin

No dependencies to install. Requires Node.js 18+.

```bash
npm start
```

- Website: http://localhost:3000
- Admin panel: http://localhost:3000/admin

## First login
Default admin credentials (created on first run in `data/auth.json`):
- Username: `admin`
- Password: `Abhyudaya@2026`

**Change these immediately** from Admin → Account & Backup.

## What's where
- `public/` – the public website (HTML/CSS/JS). `public/uploads/` holds images uploaded from the admin.
- `admin/` – the admin panel.
- `data/content.json` – all website content (edited via admin). A backup of the previous version is kept in `content.backup.json`.
- `data/enquiries.json` – contact-form submissions.
- `data/default-content.js` – seed content used only when `content.json` doesn't exist.

## Deploying
Any Node host with a persistent disk works (Render, Railway, a VPS, Hostinger Node hosting). Set `PORT` if needed.
Back up the `data/` and `public/uploads/` folders. Use HTTPS in production.
