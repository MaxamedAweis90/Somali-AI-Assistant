# PROJECT_SCOPE.md

## Somali AI Assistant — Objectives, Scope, and Rules

This document defines the **strict boundaries, objectives, and development rules** for the Somali AI Assistant project.

Its purpose is to prevent the project from becoming **uncontrolled, overly complex, or endless**.

All development decisions must follow the rules defined here.

---

# 1. Project Objective

The objective of this project is to build a **Somali-first AI chatbot web application** that allows users to interact with an AI assistant **entirely in the Somali language**.

The system must:

* Accept Somali text input
* Generate Somali responses
* Store conversation history
* Provide a modern chat interface

The project focuses on **building an AI-powered product**, not developing a new AI model.

---

# 2. What This Project Is NOT

To prevent scope creep, the following are **explicitly excluded** from this project:

* Training a new AI language model
* Building an AI model from scratch
* Creating a full AI platform
* Supporting dozens of languages
* Replacing ChatGPT or Gemini
* Building a full social platform
* Creating a massive SaaS product

The project is **a focused prototype application**.

---

# 3. Core Product Definition

The final product should be:

**A Somali AI assistant web app with a ChatGPT-style interface.**

Users can:

* Create an account
* Start a conversation
* Ask questions in Somali
* Receive structured Somali answers
* View previous conversations

---

# 4. Strict MVP Scope

The **Minimum Viable Product (MVP)** includes only the following features.

### 4.1 Authentication

Users must be able to:

* Sign up
* Log in
* Log out

Authentication must use **Appwrite**.

---

### 4.2 Chat Interface

The application must provide a **ChatGPT-style chat UI** with:

* left sidebar
* new conversation button
* conversation history
* main chat window
* message input box

---

### 4.3 Somali AI Responses

The assistant must:

* respond **only in Somali**
* structure responses clearly
* support lists and formatting

Responses should be rendered using **Markdown**.

---

### 4.4 Conversation Storage

Each conversation must be stored in the database.

Stored data includes:

```id="dbschema1"
user_id
conversation_id
message_role
message_content
timestamp
```

Users must be able to see their **previous chats**.

---

# 5. Technology Constraints

The project must use the following stack.

Frontend:

* Next.js (App Router)
* TypeScript
* TailwindCSS
* shadcn/ui

Backend:

* Next.js API routes

Backend Services:

* Appwrite (Auth + Database)

AI Layer:

* External LLM API

State Management:

* TanStack Query

Validation:

* Zod

No alternative frameworks should be introduced unless absolutely necessary.

---

# 6. Design Rules

The user interface must follow these design principles.

### ChatGPT Layout

* Left sidebar
* Chat conversation area
* Clean message bubbles

### Gemini-style Responses

Responses should be:

* structured
* readable
* organized with headings and lists

---

# 7. AI Behavior Rules

The AI assistant must obey the following rules:

1. Always respond in Somali.
2. If a user writes in another language, answer in Somali.
3. Use clear and natural Somali.
4. Prefer structured answers when helpful.
5. Avoid extremely long responses.

The assistant must behave as a **helpful Somali knowledge assistant**.

---

# 8. Development Phases

Development must follow this order.

### Phase 1 — Project Setup

* Initialize Next.js project
* Configure Tailwind
* Configure shadcn/ui
* Connect Appwrite

---

### Phase 2 — Authentication

* Login page
* Register page
* Appwrite authentication integration

---

### Phase 3 — Chat UI

* Sidebar
* Chat window
* Message input
* Markdown message rendering

---

### Phase 4 — AI Integration

* API route for chat requests
* Send prompts to LLM
* Receive responses

---

### Phase 5 — Chat Persistence

* Save conversations
* Load conversation history
* Display previous chats

---

# 9. Features Explicitly Postponed

The following features are **not part of MVP** and must not be implemented now.

Voice Features:

* speech-to-text
* text-to-speech

Advanced AI:

* document question answering
* retrieval augmented generation
* vector databases

Mobile Applications:

* React Native
* Flutter

Monetization:

* subscriptions
* payment systems

These can be considered **future extensions**.

---

# 10. Success Criteria

The project is considered **complete** when:

1. Users can create accounts.
2. Users can chat with the AI assistant.
3. AI responds only in Somali.
4. Conversations are saved.
5. Users can access past chats.
6. The interface is clean and stable.

If these conditions are met, the project is **finished for the current phase**.

---

# 11. Anti-Scope-Creep Rule

Before adding any new feature, the following question must be asked:

> Does this feature support the core objective of a Somali AI chat assistant?

If the answer is **no**, the feature must be rejected.

This rule exists to prevent the project from becoming an **endless development cycle**.

---

# 12. Final Principle

This project prioritizes:

* clarity
* usability
* stability

over:

* unnecessary complexity
* excessive features
* experimental systems

The goal is to produce a **clean, focused AI product prototype**.
