# AI_EFFICIENCY_RULES.md

## GARAS Chat — AI Usage Optimization & Cost Control

This document defines the rules and architecture for **efficient AI usage in GARAS Chat**.

Its purpose is to:

* reduce OpenAI API cost
* control token usage
* keep responses fast
* maintain good conversational context
* use Appwrite to support efficient AI memory management

These rules must be followed by the **AI coding agent** when implementing the GARAS Chat backend.

---

# 1. Core Philosophy

GARAS Chat must follow this principle:

```
Store more data locally.
Send less data to the AI.
```

The application must rely on **Appwrite database storage** for conversation history rather than repeatedly sending large message histories to the model.

The system must prioritize:

* context trimming
* conversation summaries
* token limits
* efficient message selection

---

# 2. Default Model Strategy

## Development

Use the cheaper model:

```
gpt-4o-mini
```

Reason:

* cheaper
* faster
* sufficient for development

## Production

Switch to:

```
gpt-4o
```

Reason:

* better reasoning
* stronger Somali responses
* better final user experience

---

# 3. AI Configuration Rules

Every AI request must follow these defaults.

```
temperature: 0.4
max_tokens: 550
```

Explanation:

| Parameter   | Reason                   |
| ----------- | ------------------------ |
| temperature | keeps answers structured |
| max_tokens  | prevents long responses  |
| 550 tokens  | balanced response size   |

The system must **not exceed 550 tokens** unless specifically required.

---

# 4. Context Window Control

The application must **never send the entire chat history** to the AI model.

Instead, send only:

1. system prompt
2. conversation summary (if available)
3. last recent messages
4. the new user message

### Recommended message window

Send only:

```
last 5 messages
```

This includes both:

* user messages
* assistant messages

This keeps token usage small and predictable.

---

# 5. Conversation Summary System

When conversations become long, the system must summarize earlier messages.

## When to summarize

Trigger summary when:

* conversation exceeds **12 messages**
  OR
* message token estimate becomes large

## Summary goal

The summary should capture:

* user objective
* important context
* previous conclusions
* relevant facts

Example summary:

```
User is developing GARAS Chat, a Somali-first AI assistant.
The conversation includes discussion about AI model selection, cost control, and Appwrite integration.
User prefers structured Somali responses and controlled token usage.
```

The summary replaces old messages in future requests.

---

# 6. Request Construction Rule

When sending a request to the AI, messages must be structured like this:

```
[
system_prompt,
conversation_summary,
recent_message_1,
recent_message_2,
recent_message_3,
recent_message_4,
recent_message_5,
current_user_message
]
```

Older messages must **not be sent once summarized**.

---

# 7. Appwrite Database Integration

Appwrite must store all chat data so the AI does not need full history.

The system must create these collections.

---

## conversations

Stores chat-level metadata.

Fields:

```
user_id
title
summary
message_count
created_at
updated_at
```

---

## messages

Stores chat messages.

Fields:

```
conversation_id
role
content
token_estimate
created_at
```

Role values:

```
user
assistant
system
```

---

## ai_usage_logs

Stores AI usage tracking.

Fields:

```
conversation_id
user_id
model
input_tokens
output_tokens
estimated_cost
created_at
```

---

# 8. Conversation Title Generation

Conversation titles must be generated **only once**.

Rules:

* use the first user message
* avoid repeated AI calls for titles
* prefer simple heuristics

Example:

User message:

```
Waa maxay React?
```

Conversation title:

```
React Sharaxaad
```

---

# 9. Token Estimation

Each message should have a **token estimate** saved in the database.

Approximation rule:

```
1 token ≈ 4 characters
```

This helps determine when to trigger conversation summaries.

---

# 10. Usage Logging

Every AI call must log usage details.

Minimum fields:

```
model
input_tokens
output_tokens
estimated_cost
conversation_id
user_id
timestamp
```

Purpose:

* monitor API cost
* identify heavy users
* detect inefficient requests

---

# 11. Error Handling

If the AI request fails:

The application must display a friendly Somali message.

Example:

```
Wax yar ayaa khaldamay. Fadlan isku day mar kale.
```

The system must not expose:

* API errors
* stack traces
* internal server details

---

# 12. Retry Policy

The system must **not retry AI requests automatically multiple times**.

Reason:

* repeated retries increase cost
* unnecessary token usage

If failure occurs:

1. log the error
2. show user-friendly message
3. allow manual retry

---

# 13. Message Cleaning

Before sending messages to the AI:

The system must remove:

* empty messages
* UI-only messages
* formatting artifacts
* excessive whitespace

Only meaningful conversation text should be included.

---

# 14. System Prompt Protection

The system prompt must remain:

* short
* stable
* consistent

It must include:

* GARAS identity
* Somali-first language rule
* response formatting style

It must **not include long repetitive instructions**.

---

# 15. Cost Control Strategy

The system must always prefer:

```
summary + recent messages
```

instead of:

```
full conversation history
```

This reduces token usage by **70–90%**.

---

# 16. Future Extension Compatibility

The architecture must remain compatible with future features:

* voice chat
* document AI
* search augmentation
* premium plans
* usage limits

The AI efficiency system must not block these future upgrades.

---

# 17. Implementation Order

The AI coding agent must implement these features in this order.

Step 1
Create Appwrite collections.

Step 2
Implement message persistence.

Step 3
Implement recent message retrieval.

Step 4
Implement conversation summaries.

Step 5
Inject summary into AI requests.

Step 6
Implement AI usage logging.

Step 7
Apply AI configuration defaults.

```
model: gpt-4o-mini
temperature: 0.4
max_tokens: 550
```

Step 8
Allow easy upgrade to:

```
gpt-4o
```

for production.

---

# 18. Hard Rules

The AI coding agent must follow these rules strictly.

1. Never send full conversation history.
2. Always store messages in Appwrite.
3. Always limit output to 550 tokens.
4. Always summarize long conversations.
5. Always log AI usage.
6. Always trim unnecessary text.

---

# 19. Final Principle

GARAS Chat must behave like a **smart AI system**, not a wasteful prototype.

The correct architecture is:

```
store more
send less
summarize early
limit tokens
track usage
```

This approach allows GARAS Chat to operate efficiently even with small API budgets.
