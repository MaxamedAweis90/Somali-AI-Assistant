# Vercel Setup Guide

## 1. Deploying the project

1. Push the repository to GitHub.
2. In Vercel, choose **Add New Project** and import the GitHub repository.
3. Keep the framework preset as **Next.js**.
4. Add the required environment variables for your AI providers and Appwrite configuration.
5. Deploy the project.

### Option A (Recommended): Two Vercel projects from one repo

This is the most reliable way to have two different hostnames (one for landing, one for chat) without buying a custom domain.

Create two Vercel projects pointing to the **same GitHub repo**:

1. **Landing project** (example domain: `garas.vercel.app`)
	 - Environment variables:
		 - `APP_VARIANT=landing`
		 - (Optional) `CHAT_BASE_URL=https://chat-garas.vercel.app` (used to redirect `/chat` and `/c/...` to the chat project)

2. **Chat project** (example domain: `chat-garas.vercel.app`)
	 - Environment variables:
		 - `APP_VARIANT=chat`
		 - (Optional) `LANDING_BASE_URL=https://garas.vercel.app` (used to redirect `/home` back to the landing project)

Notes:
- The code supports chat hostnames that start with `chat.` (custom domains) **or** `chat-` (Vercel-style names like `chat-garas.vercel.app`).
- Both projects can share the same AI/Appwrite env vars.

## 2. Using Vercel default domains

With Vercel's default `*.vercel.app` domain, a project typically gets **one** production hostname:

- `YOUR_PROJECT_NAME.vercel.app`

Because you generally cannot add arbitrary subdomains under `vercel.app` (for example `chat.garas.vercel.app`) to the same project, the **reliable** way to reach the chat on the default domain is path-based routing:

- `https://YOUR_PROJECT_NAME.vercel.app/chat`

The root route checks the incoming host and sends users to `/home` or `/chat`, while `proxy.ts` rewrites root requests so the correct app section is rendered.

## 3. Adding the chat subdomain

If you want `chat.` subdomain routing (so the chat opens at `https://chat.YOUR_DOMAIN`), use a **custom domain**:

1. Buy / use a domain you control (example: `garas.ai`).
2. In Vercel → **Settings** → **Domains**, add both:
	- `garas.ai`
	- `chat.garas.ai`
3. Follow Vercel's DNS instructions for the apex and subdomain.

Why this matters: the code checks `hostname.startsWith("chat.")`. That will work with custom domains like `chat.garas.ai`, but Vercel usually won’t let you create `chat.garas.vercel.app` under the default `vercel.app` namespace.

## 4. Testing routing

After deployment, verify these cases:

1. Visit `https://YOUR_PROJECT_NAME.vercel.app` and confirm it loads the landing page.
2. Visit `https://YOUR_PROJECT_NAME.vercel.app/home` and confirm it loads the landing page directly.
3. Visit `https://YOUR_PROJECT_NAME.vercel.app/chat` and confirm it loads the chat UI.
4. (Custom domain) Visit `https://chat.YOUR_DOMAIN` and confirm it opens the chat application.
5. Send a request to `/api/chat` and confirm the API still responds.

## 5. Future upgrade

Later, the same routing approach can be used with a custom domain:

- `garas.ai` -> landing page
- `chat.garas.ai` -> chat application

In that setup, add both domains in Vercel, update DNS records, and keep the same host-based redirect and middleware logic already present in the codebase.