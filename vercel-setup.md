# Vercel Setup Guide

## 1. Deploying the project

1. Push the repository to GitHub.
2. In Vercel, choose **Add New Project** and import the GitHub repository.
3. Keep the framework preset as **Next.js**.
4. Add the required environment variables for your AI providers and Appwrite configuration.
5. Deploy the project.

## 2. Using Vercel default domains

The routing code is prepared for these production hostnames:

- `garas.vercel.app`
- `chat.garas.vercel.app`

The root route checks the incoming host and sends users to `/home` or `/chat`, while `proxy.ts` rewrites root requests so the correct app section is rendered.

## 3. Adding the chat subdomain

In Vercel:

1. Open the project.
2. Go to **Settings**.
3. Open **Domains**.
4. Add `chat.garas.vercel.app` to the same project.

Important note:

Vercel's default `vercel.app` hostname behavior can vary by account, project naming, and available aliases. If Vercel does not allow `chat.garas.vercel.app` as an additional domain on the default hostname, use a custom domain such as `garas.ai` and `chat.garas.ai` for production.

## 4. Testing routing

After deployment, verify these cases:

1. Visit `https://garas.vercel.app` and confirm it loads the landing page.
2. Visit `https://garas.vercel.app/home` and confirm it loads the landing page directly.
3. Visit `https://garas.vercel.app/chat` and confirm it loads the chat UI.
4. Visit `https://chat.garas.vercel.app` and confirm it opens the chat application.
5. Send a request to `/api/chat` and confirm the API still responds.

## 5. Future upgrade

Later, the same routing approach can be used with a custom domain:

- `garas.ai` -> landing page
- `chat.garas.ai` -> chat application

In that setup, add both domains in Vercel, update DNS records, and keep the same host-based redirect and middleware logic already present in the codebase.