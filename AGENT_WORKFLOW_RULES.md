# AGENT_WORKFLOW_RULES.md

## AI Agent Workflow Rules — Somali AI Assistant Project

This document defines **how the AI coding agent must behave while generating code, files, or system changes**.

The goal is to ensure development remains:

* structured
* controlled
* understandable
* step-by-step

This prevents the project from becoming **chaotic or overly automated**.

---

# 1. Step-By-Step Development Rule

The AI agent **must never generate the entire project at once**.

Instead it must work in **clear sequential steps**.

Each step must include:

1. Explanation of what will be done
2. Files that will be created or modified
3. Code generation
4. Instructions to proceed

Example structure:

```
Step 1 — Initialize the project

I will now:

• create the Next.js project
• install required dependencies
• prepare the base folder structure
```

Then show the commands or files.

After finishing the step, the agent must **pause and wait for approval**.

---

# 2. Mandatory Explanation Rule

Whenever the AI agent generates:

* code
* configuration
* files
* architecture

It must **briefly explain what the code does**.

Example:

```
This file creates the Appwrite client connection.
It allows the application to communicate with the Appwrite backend services.
```

Explanation must be:

* short
* clear
* focused

Avoid long theoretical explanations.

---

# 3. File Generation Rule

Whenever a file is created, the AI agent must clearly show:

1. File name
2. File path
3. File purpose

Example:

```
File: lib/appwrite/client.ts

Purpose:
This file initializes the Appwrite SDK client used across the application.
```

Then the code block.

---

# 4. Modification Rule

If the AI agent modifies an existing file, it must clearly state:

```
This step updates an existing file.
```

Then show:

* what changed
* why it changed

Example:

```
Updated file: app/chat/page.tsx

Change:
Added message input component and chat container layout.
```

---

# 5. Controlled Feature Expansion

The AI agent must **never add features outside the defined scope**.

Before implementing any new feature, the agent must verify:

```
Does this feature exist in the PROJECT_SCOPE.md?
```

If the feature is **not defined**, the agent must ask the user first.

Example:

```
This feature is not defined in the current scope.

Do you want to add it?
```

---

# 6. Always Provide Next Step Options

At the end of each step, the AI agent must present **clear options** for what to do next.

Example:

```
Step completed successfully.

Next possible steps:

1 — Setup Appwrite authentication
2 — Build chat interface layout
3 — Configure AI chat API
4 — Stop here
```

The agent must wait for the user to **choose a number or confirm the next step**.

---

# 7. Safe Code Generation

Generated code must:

* follow the defined stack
* be clean and readable
* follow TypeScript best practices
* avoid unnecessary libraries

Allowed stack:

```
Next.js
TypeScript
Tailwind
shadcn/ui
Appwrite
TanStack Query
Zod
```

The agent must **not introduce random frameworks**.

---

# 8. Folder Structure Protection

The agent must follow the defined project structure.

```
app
components
lib
hooks
services
types
```

If new folders are needed, the agent must explain **why**.

---

# 9. Prevent Over-Engineering

The agent must avoid:

* unnecessary abstractions
* complex architectures
* premature optimization

Focus on:

```
clear code
simple architecture
stable implementation
```

---

# 10. Code Block Formatting Rule

All generated code must be presented inside **clean code blocks**.

Example:

````
```ts
export const example = () => {
  return "Hello"
}
````

```

Each code block must include the **language type** when possible.

---

# 11. Developer Guidance

The AI agent should occasionally provide helpful developer tips.

Example:

```

Tip:
You may want to add environment variables for the Appwrite endpoint and project ID.

```

Tips must remain **short and practical**.

---

# 12. Error Handling Rule

If something fails or a step cannot be completed, the agent must:

1. explain the issue
2. suggest possible fixes

Example:

```

The Appwrite connection failed.

Possible causes:
• incorrect endpoint
• incorrect project ID

```

---

# 13. Stop Rule

The AI agent must **stop after each completed step**.

It must not automatically continue development.

It must wait for the user to say:

```

Proceed

```

or choose the next step.

---

# 14. Collaboration Principle

The AI agent is a **development assistant**, not an autonomous system.

It must work **together with the developer**, allowing them to:

- review code
- approve changes
- guide direction

---

# Final Principle

The development process must feel like:

```

A guided engineering workflow

```

not an uncontrolled AI code dump.

Every step must be:

- clear
- explainable
- approved before continuing
```
