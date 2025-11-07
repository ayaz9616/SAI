# Pink Diary (Next.js New_version)

This is a modern Next.js rewrite of the original Pink Diary app. It supports Node 18/20/22 and uses MongoDB via Mongoose.

## Features
- Sign up, log in (JWT cookie)
- Home calendar showing logged period days and simple predictions
- Log symptoms: flow, mood, pain, sex
- Help requests (basic stub)

## Getting started (development)
1. Copy env and install dependencies:

```powershell
Copy-Item .env.example .env.local
# Edit .env.local to set MONGODB_URI, JWT_SECRET, GEMINI_API_KEY (optional)
npm install
npm run dev
```

Dev server runs at http://127.0.0.1:3500

## Required environment variables
| Name | Purpose |
|------|---------|
| `MONGODB_URI` | Connection string for MongoDB database |
| `JWT_SECRET` | Secret used to sign JWT auth cookie |
| `GEMINI_API_KEY` | (Optional) Key for AI advice/chat; if omitted, fallbacks show static tips |

Provide these in `.env.local` for local dev or as host/container environment variables in production.

## Production build
```powershell
npm run build
npm run start
```
`next start` serves the optimized build on port 3500 as configured in package.json.

## Docker deployment
Build and run the included Dockerfile:
```powershell
docker build -t pink-diary:prod ./New_version
docker run -d -p 3500:3500 --name pink-diary ^
	-e MONGODB_URI="mongodb://host.docker.internal:27017/pink-diary-next" ^
	-e JWT_SECRET="replace_me" ^
	-e GEMINI_API_KEY="optional_key" ^
	pink-diary:prod
```
On Linux/macOS replace PowerShell line continuation `^` with `\`.

## Vercel deployment
1. Push repository to GitHub.
2. In Vercel dashboard: New Project → Import → Select `New_version` directory as root.
3. Add Environment Variables (Production & Preview): `MONGODB_URI`, `JWT_SECRET`, optional `GEMINI_API_KEY`.
4. Deploy. Vercel will run `npm install` then `next build` automatically.

## PM2 (optional) process manager
You can create an `ecosystem.config.js` like:
```js
module.exports = {
	apps: [{
		name: 'pink-diary',
		script: 'npm',
		args: 'run start',
		env: { PORT: 3500 }
	}]
};
```
Then run:
```powershell
pm2 start ecosystem.config.js
pm2 save
```

## Health checks
- Mongo connectivity errors: ensure `MONGODB_URI` is reachable from host/container.
- JWT issues: confirm `JWT_SECRET` identical across all running instances.
- AI endpoints returning 404: supply `GEMINI_API_KEY`; otherwise static fallback advice is used.

## Folder structure (production relevance)
- `app/` – Next.js App Router pages & API routes
- `models/` – Mongoose schemas
- `lib/db.js` – Lazy Mongo connection (pool size 10)
- `Dockerfile` – Multi-stage build producing minimal runtime image

## Security notes
- JWT cookie is httpOnly; ensure `NODE_ENV=production` so Next sets secure flags when served over HTTPS.
- Never commit real secrets; keep only `.env.example` in version control.

## Scaling tips
- Use MongoDB Atlas for managed DB (set `MONGODB_URI`).
- Add an index on `Entry` collection if query volume grows (e.g., `{ userId: 1, date: 1 }`).
- Consider enabling image optimization domains in `next.config.js` if external avatars are added.

## Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| App boots but API 401 | Missing JWT cookie | Log in; check `JWT_SECRET` consistency |
| Build fails on Mongo var | `MONGODB_URI` absent | Set in environment before build/start |
| AI endpoints 500/404 | Missing/invalid Gemini key | Set `GEMINI_API_KEY` or rely on fallback |
| Container can’t reach DB | Network bridge / host mapping | Use `host.docker.internal` (Mac/Win) or link container |

## Deployment summary
Minimum for production: set env vars, `npm run build`, run `npm run start` (or use Docker image). For a managed platform, point root to `New_version` and configure environment variables.

## Notes
- API routes live under `app/api/*` (App Router)
- Mongo connection is cached for hot reload
- Auth uses httpOnly JWT cookie `token`
 - Styling uses Tailwind CSS; utility classes are available out of the box
 - Fallback AI logic activates automatically when `GEMINI_API_KEY` missing