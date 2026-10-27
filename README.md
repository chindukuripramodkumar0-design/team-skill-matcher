# Team Skill Matcher

AI-assisted team skill matching platform. Dark Vercel-style UI.

Split into **HTML / CSS / JS** with a **zero-dependency Node** server.

## Run locally

```bash
node server.js
```

Or:

```bash
npm start
```

Then open `http://localhost:8080`

Requires **Node 18+**. No `npm install` needed.

## Demo login

- Email: `demo@acme.ai`
- Password: `demo123`

## Project layout

```
team-skill-matcher/
├── server.js              # Node HTTP server (static + /api/health)
├── package.json
├── public/
│   ├── index.html         # App shell
│   ├── css/styles.css     # Theme, glass panels, match badges
│   └── js/app.js          # React UI (Babel in-browser)
```

## Features

- Login / signup with per-user data isolation (`localStorage` key `grok_team_matcher_db`)
- Team roster CRUD (name, role, experience, skill tags + proficiency)
- Multiple projects with must-have / nice-to-have skill requirements
- Weighted match matrix ranked best → worst
- Sort, filter, expand rows, export CSV
- Auto-seeds Acme AI demo data only when storage is empty

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server health |
| GET | `/api/info` | App metadata |
| GET | `/*` | Static files from `public/` |

## Deploy to a new Netlify site

This project now includes `netlify.toml` configured to publish the static app from `public/` and deploy the Bitbucket serverless function from `netlify/functions/`.

1. Create a **new** site in Netlify (do not select or overwrite your existing site).
2. Upload/import this project folder or connect a new repository containing these files.
3. Build settings should use publish directory `public`; the included `netlify.toml` already sets it.
4. In the new site's **Site configuration → Environment variables**, add `BITBUCKET_TOKEN`, `BITBUCKET_WORKSPACE`, and `BITBUCKET_REPO`. Use a narrowly scoped Bitbucket token with read-only repository access.
5. Redeploy. Open the new site's Bitbucket tab to check the live repository data.

The `.env.example` file is only a template. Never put a real token into source code, commit history, screenshots, or a ZIP. If a token was included in an earlier archive, revoke it and create a new one. Do not expect live Bitbucket data until the environment variable is configured correctly.

## Deploy to a Node host / run locally

Any Node host (or Docker) can serve the static frontend. Netlify Functions do not execute in the simple Node server; use Netlify deployment or Netlify CLI for the live Bitbucket integration.

Set `PORT` if needed:

```bash
PORT=3000 node server.js
```

You can also open `public/index.html` directly in a browser (CDNs still required).


## Run locally with Docker

From this project directory, run:

```powershell
docker build -t team-skill-matcher:1.0 .
docker rm -f team-skill-matcher-demo 2>$null
docker run -d --name team-skill-matcher-demo -p 8082:8080 team-skill-matcher:1.0
```

Open http://localhost:8082. Health check: http://localhost:8082/api/health.

## Bitbucket integration note

The Docker static server deliberately returns a JSON `503` at `/.netlify/functions/bitbucket` because Netlify Functions do not run inside this simple static Docker server. This avoids the previous HTML-fallback response being misread as JSON. To use the live Bitbucket panel, deploy through Netlify or run with Netlify CLI and configure `BITBUCKET_TOKEN` as an environment variable in your local environment / Netlify site settings. Do not commit `.env` files or tokens. A token that was included in an earlier project ZIP should be revoked/rotated before reuse.

## Security note

This is a student/demo application. Do not use real passwords or production secrets in the demo. Authentication and browser localStorage are not a production identity/security system.


## New Insights & Reports tab

- Skill distribution chart based on saved team skills.
- Project best-match summaries and rule-based required-skill gap detection.
- Workload estimate based on top skill-match assignments (not actual hours/task telemetry).
- Per-project target-date fields saved in the current browser.
- Notifications for uncovered required skills and projects without a target date.
- Downloadable JSON report containing team skills, project requirements, match recommendations, gaps, milestones, workload estimates and alerts.
- Project assistant for simple questions about the currently saved workspace data.

This assistant is rule-based and runs locally; it is not connected to an external generative AI model. The app does not currently store task-event history, so true task completion trends/activity graphs are not available. Bitbucket repository health depends on a working Netlify Function and valid repository credentials. Data in the browser is local to that browser/device and is not a shared multi-user database.
