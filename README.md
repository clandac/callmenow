# Genesys Cloud – Call Me Now (EU Central)

Single-page HTML + Node proxy to create on-demand callbacks via Genesys Cloud.

## Quick Start
```bash
npm i
cp .env.example .env
# Put your OAuth Client Credentials into .env
npm start
# open http://localhost:3000
```

## Create OAuth Client (Genesys Cloud)
- Admin → Integrations → OAuth → Add Client
- Grant Type: **Client Credentials**
- Permissions: `conversation:callback:create` (and optionally `routing:queue:view`)
- Region: EU Central (Frankfurt)
- Copy Client ID/Secret into `.env`

## How It Works
- Browser posts to `/api/callback` (no secrets in the browser).
- Node proxy retrieves token from `https://login.mypurecloud.de`.
- Proxy calls `POST https://api.mypurecloud.de/api/v2/conversations/callbacks`.
- Queue ID used in `index.html` is `207c4074-14c8-4116-885e-b91d8638a922`.

## Docker
```bash
docker build -t callmenow:latest .
docker run -p 3000:3000 --env-file .env callmenow:latest
```

## docker-compose
```yaml
services:
  callmenow:
    build: .
    ports: ["3000:3000"]
    env_file: .env
    restart: unless-stopped
```

## GitHub Actions (optional)
Workflow provided at `.github/workflows/node.yml` to install deps and build Docker image.
To push the image to GitHub Container Registry, set repo secrets:
- `CR_USER` your GitHub username
- `CR_PAT` a PAT with `write:packages`
- `IMAGE_NAME` e.g. `ghcr.io/<owner>/<repo>:latest`

## Troubleshooting
- **401/403:** permissions or wrong region/org. Ensure OAuth client has `conversation:callback:create` and you’re using *.de endpoints.
- **CORS / TypeError: Load failed:** the browser must call **/api/callback**, not the Genesys API directly.
- **400:** check `queueId` and `phoneNumber` format (E.164).

