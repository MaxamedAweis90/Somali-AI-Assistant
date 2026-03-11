**Prompt for AI Code Assistant**

You are working on an existing **Next.js App Router project** that currently contains an AI chat application at the root. Your task is to restructure the project to support **subdomain-based routing** for Vercel.

## 1. First Step — Scan the Existing Codebase

Before making any changes:

* Analyze the current **Next.js folder structure**
* Identify:

  * `app/page.tsx`
  * `app/layout.tsx`
  * `app/api/chat/route.ts`
  * all chat-related components
* Determine where the **chat UI logic currently lives**
* Check whether the project already uses **middleware.ts**

Then summarize the current structure before applying modifications.

---

# 2. Target Architecture

Restructure the project so the application supports:

| URL                     | Page                |
| ----------------------- | ------------------- |
| `garas.vercel.app`      | Landing page        |
| `chat.garas.vercel.app` | AI Chat application |

Using **Vercel default domains only** (no custom domain).

---

# 3. Required Project Structure

Modify the project so it follows this structure:

app
├ home
│   └ page.tsx              → Landing page
│
├ chat
│   └ page.tsx              → Chat application UI
│
├ api
│   └ chat
│        └ route.ts         → AI chat API
│
├ layout.tsx
├ page.tsx                  → hostname router
└ middleware.ts             → subdomain routing

If the chat currently exists at `app/page.tsx`, move the logic into:

app/chat/page.tsx

---

# 4. Create Landing Page

Create a **clean SaaS-style landing page** in:

app/home/page.tsx

Requirements:

Sections:

1. Hero section
2. Product explanation
3. Features
4. Call-to-action button → "Start Chatting"
5. Footer

Design rules:

* TailwindCSS
* responsive
* modern AI product style
* minimal but professional

Hero example:

Headline:
"Garas — Somali AI Assistant"

Subtext:
"A modern AI assistant built for Somali speakers."

CTA button should link to:

/chat

---

# 5. Root Router Logic

Modify `app/page.tsx` so it detects the host and redirects:

Behavior:

chat.garas.vercel.app → /chat
garas.vercel.app → /home

Implementation should use:

next/headers
next/navigation

---

# 6. Middleware for Subdomain Routing

Create `middleware.ts` that:

* reads the `host` header
* rewrites routes based on subdomain

Behavior:

if host starts with `chat.` → rewrite to `/chat`
otherwise → rewrite to `/home`

Ensure middleware does **not interfere with API routes**.

---

# 7. Keep Chat API Working

Ensure the following still works:

/api/chat

The middleware should **not break API routes**.

---

# 8. After Code Changes

After implementing the changes:

Provide the **full updated folder structure**.

Then verify:

* chat UI loads from `/chat`
* landing page loads from `/home`
* API route still works

---

# 9. Generate a Manual Setup Guide

Create a file:

vercel-setup.md

This file should explain **manual steps required in Vercel**.

Include:

### 1. Deploying the Project

* connect GitHub repo
* deploy Next.js project

### 2. Using Default Vercel Domains

Explain that the project will use:

garas.vercel.app
chat.garas.vercel.app

### 3. Adding Subdomain

In:

Vercel Dashboard
Project
Settings
Domains

Add:

chat.garas.vercel.app

pointing to the same project.

### 4. Testing Routing

Verify:

garas.vercel.app → landing page
chat.garas.vercel.app → chat app

### 5. Future Upgrade

Explain briefly how this could later work with:

garas.ai
chat.garas.ai

---

# 10. Output Requirements

Provide:

1. Updated folder structure
2. All new files created
3. Middleware code
4. Landing page code
5. Redirect logic
6. The `vercel-setup.md` file

Make the implementation **production-safe and clean**.
