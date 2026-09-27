Admin app (Vite + React + Tailwind)

Quick start:

1. Install dependencies

```bash
cd admin-app
npm install
```

2. Run dev server

```bash
npm run dev
```

3. Build for production (output will be placed into `../public/admin-app` so the existing Express server can serve it):

```bash
npm run build
```

The admin app authenticates with the existing server endpoints `/admin/login`, `/admin/me`, and uses `/api/*` endpoints. The default demo credentials are `admin` / `password` (override with `ADMIN_USER` and `ADMIN_PASS`).
