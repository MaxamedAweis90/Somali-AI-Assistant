# Somali AI Assistant — AI Agent Instructions

## Project Overview

You are responsible for building **Somali AI Assistant**, a web-based AI chatbot that communicates **only in Somali** using text (and later voice).
The product should look visually similar to **ChatGPT-style conversation UI** while delivering **fast, structured responses similar to Gemini-style outputs**.

The goal is to create a **Somali-first AI assistant** that allows Somali users to interact with modern AI systems in their native language.

This project focuses on **software engineering + AI integration**, not training a new language model.

---

# Core Principle

The assistant must:

* Accept Somali text input
* Respond **strictly in Somali**
* Store conversation history
* Provide fast and structured responses
* Be easy to extend with voice support later

If the user writes in another language, the assistant should:

1. Translate internally if needed
2. Respond **only in Somali**

---

# Technology Stack

Use the following stack.

## Frontend

* **Next.js (App Router)**
* **TypeScript**
* **TailwindCSS**
* **shadcn/ui**
* **Lucide icons**

## Backend

Use **Next.js API routes / server actions**

## AI Integration

Use an **LLM API** as the reasoning engine.

Important:
The AI must be controlled by a **system prompt that enforces Somali-only responses**.

## Backend Services

Use **Appwrite** for:

* Authentication
* Database
* Storage (future)
* User sessions

## State & Utilities

* **TanStack Query** (data fetching)
* **Zod** (validation)
* **React Hook Form** (forms)

---

# System Architecture

```
User
 ├─ types Somali message
 └─ (future) speaks Somali voice
        ↓
Next.js Frontend
        ↓
API Route / Server Action
        ↓
LLM API (Somali system prompt)
        ↓
Appwrite Database (chat history)
        ↓
Response returned to UI
```

Future voice architecture:

```
Voice Input
 ↓
Speech-to-Text
 ↓
Somali AI Assistant
 ↓
Text-to-Speech
 ↓
Audio reply
```

---

# Core Features (MVP)

### 1. Authentication

Use **Appwrite Auth**.

Users can:

* Sign up
* Login
* Logout

Each user has:

```
id
email
name
created_at
```

---

### 2. Chat Interface

The chat interface must resemble **ChatGPT layout**.

Left sidebar:

* New chat
* Conversation history
* User profile

Main area:

* conversation messages
* message input
* streaming AI response

---

### 3. Gemini-Style Response Rendering

Responses should support:

* headings
* lists
* structured answers
* code blocks
* emphasis

This gives the assistant a **Gemini-like structured response feel**.

Use **Markdown rendering**.

---

### 4. Conversation Storage

Use Appwrite Database.

Collections:

```
users
conversations
messages
```

Example structure.

Conversations:

```
id
user_id
title
created_at
```

Messages:

```
id
conversation_id
role (user | assistant)
content
created_at
```

---

### 5. Somali-Only AI Behavior

Use a strict **system instruction** for the AI.

Example behavior rules:

* Always respond in Somali
* Never answer in English
* If user writes another language, reply in Somali
* Use clear and natural Somali
* Structure answers clearly

Example:

```
You are a Somali AI assistant.

Rules:
1. Always respond in Somali.
2. If the user writes in another language, still respond in Somali.
3. Use clear Somali sentences.
4. Structure answers using lists and headings when helpful.
```

---

# UI Design Requirements

Design should combine:

### ChatGPT Style

* clean chat layout
* message bubbles
* left sidebar

### Gemini Style

* structured responses
* clear sections
* visually readable answers

Use:

* Tailwind
* shadcn components
* responsive layout

Dark mode should be default.

---

# Folder Structure

```
app
 ├ chat
 │ └ page.tsx
 ├ api
 │ └ chat
 │    └ route.ts
 ├ login
 └ register

components
 ├ chat
 ├ sidebar
 ├ ui

lib
 ├ appwrite
 ├ ai
 ├ utils

types
hooks
services
```

---

# AI Chat Flow

1. User sends message
2. Message saved to database
3. API route sends request to LLM
4. AI response returned
5. Response saved to database
6. UI renders assistant message

---

# Initial Development Steps

Follow this order:

### Step 1

Initialize Next.js project with TypeScript.

### Step 2

Install dependencies:

* Tailwind
* shadcn/ui
* Appwrite SDK
* React Markdown
* TanStack Query
* Zod

### Step 3

Configure Appwrite:

* authentication
* database
* collections

### Step 4

Build authentication pages.

### Step 5

Create ChatGPT-style layout.

### Step 6

Implement chat API route.

### Step 7

Integrate AI responses.

### Step 8

Store conversation history.

---

# Future Features

These should not be implemented in MVP but must be supported later.

### Voice Support

Somali speech input and output.

### Document Chat

Upload Somali PDFs and ask questions.

### Mobile Version

React Native or Flutter client.

---

# Output Expectations

When implementing:

* Write clean TypeScript
* Use reusable components
* Maintain clear folder organization
* Ensure scalability

The goal is to build a **production-quality Somali AI assistant prototype**.

Start by:

1. Initializing the Next.js project
2. Setting up Tailwind and shadcn
3. Integrating Appwrite authentication
4. Creating the ChatGPT-style chat layout
