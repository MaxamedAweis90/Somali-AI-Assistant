# AI_PROVIDER_SETUP.md

## GARAS Chat — AI Provider Integration (Gemini First, OpenAI Optional)

This document defines how the GARAS Chat backend must integrate with AI providers.

The goal is:

* use **Gemini as the primary provider**
* allow **OpenAI as an optional provider in the future**
* keep the architecture flexible
* minimize AI cost
* follow the efficiency rules defined in `AI_EFFICIENCY_RULES.md`

The system must be designed so the **AI provider can be switched without changing the application logic**.

---

# 1. Default AI Provider

GARAS Chat must use **Gemini API as the primary AI provider**.

Primary model:

```text
gemini-1.5-flash
```

Reason:

* very low cost
* generous free tier
* fast responses
* suitable for chat applications
* sufficient multilingual capability

This model must be the **default model used by the system**.

---

# 2. Future Provider Support

The architecture must allow switching to **OpenAI models** later without rewriting the chat system.

Supported future provider:

```text
OpenAI
```

Example future model:

```text
gpt-4o
```

This means the system must implement a **provider abstraction layer**.

---

# 3. AI Provider Configuration

Create a configuration file to define the active provider.

Example:

```text
AI_PROVIDER=gemini
```

Possible values:

```text
gemini
openai
```

This variable must be stored in the environment configuration.

Example `.env`:

```text
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
```

The application must read this variable to determine which AI provider to use.

---

# 4. Default AI Settings

All providers must follow the same generation settings.

```text
temperature: 0.4
max_tokens: 550
```

Reason:

* controlled responses
* prevents excessive token usage
* improves cost efficiency
* aligns with GARAS structured response style

These settings must remain consistent across providers.

---

# 5. Provider Abstraction Layer

The application must create a **single AI service module** that hides provider differences.

Example file:

```
/lib/ai/aiService.ts
```

This module must:

* detect the selected provider
* call the correct API
* return a standardized response

All chat routes must call this module instead of calling providers directly.

---

# 6. Gemini Implementation

Install Gemini SDK:

```bash
npm install @google/generative-ai
```

Example implementation:

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateGeminiResponse(prompt) {

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash"
  });

  const result = await model.generateContent(prompt);

  return result.response.text();
}
```

The Gemini provider must be the **first implemented provider**.

---

# 7. OpenAI Implementation (Future)

Install OpenAI SDK:

```bash
npm install openai
```

Example implementation:

```javascript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateOpenAIResponse(messages) {

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.4,
    max_tokens: 550,
    messages
  });

  return completion.choices[0].message.content;
}
```

This provider must remain **disabled by default**.

---

# 8. AI Service Router

The AI service must route requests to the correct provider.

Example logic:

```javascript
export async function generateAIResponse(input) {

  const provider = process.env.AI_PROVIDER;

  if (provider === "gemini") {
    return generateGeminiResponse(input);
  }

  if (provider === "openai") {
    return generateOpenAIResponse(input);
  }

  throw new Error("Invalid AI provider");
}
```

All chat requests must go through this function.

---

# 9. Appwrite Integration

GARAS Chat must use **Appwrite database** to reduce AI usage.

The AI system must rely on Appwrite for:

* storing messages
* retrieving recent messages
* storing conversation summaries
* logging AI usage

Collections required:

```
conversations
messages
ai_usage_logs
```

This ensures the AI provider receives **minimal necessary context**.

---

# 10. Context Control

Before sending a request to the AI provider, the system must construct the request using:

```
system_prompt
conversation_summary
last 5 messages
current_user_message
```

Older messages must not be sent.

This rule significantly reduces token consumption.

---

# 11. Conversation Summaries

When conversations exceed **12 messages**, the system must generate a summary.

The summary must be stored in Appwrite and used in future AI requests.

Example summary:

```
User is discussing GARAS Chat development.
The conversation includes AI model selection and optimization strategies.
User prefers Somali-first responses and structured explanations.
```

This summary replaces earlier message history.

---

# 12. AI Usage Logging

Every AI call must log usage information in Appwrite.

Fields:

```
conversation_id
user_id
model
provider
input_tokens
output_tokens
estimated_cost
timestamp
```

This enables monitoring of:

* AI costs
* model usage
* heavy conversations
* system efficiency

---

# 13. Somali Behavior Rules

GARAS Chat must follow these language rules.

The AI system prompt must enforce:

* Somali-first responses
* clear structured answers
* friendly tone
* culturally aware behavior

If a user writes another language:

* respond primarily in Somali
* translation may be provided if requested

Arabic responses may be supported with Somali explanation.

---

# 14. Error Handling

If an AI request fails:

The system must return a friendly Somali message.

Example:

```
Wax yar ayaa khaldamay. Fadlan isku day mar kale.
```

The system must not expose:

* API error messages
* stack traces
* internal configuration

---

# 15. Implementation Order

The AI coding agent must implement this system in the following order.

Step 1
Install Gemini SDK.

Step 2
Create AI provider abstraction layer.

Step 3
Implement Gemini provider.

Step 4
Implement OpenAI provider (optional).

Step 5
Connect AI system with Appwrite conversation storage.

Step 6
Apply context control and conversation summaries.

Step 7
Enable AI usage logging.

---

# 16. Final Architecture

GARAS Chat AI flow:

```
User Message
     ↓
Appwrite (load context)
     ↓
AI Service Layer
     ↓
Gemini Provider (default)
     ↓
AI Response
     ↓
Save Response in Appwrite
     ↓
Return Response to Chat UI
```

---

# 17. Final Principle

GARAS Chat must always follow these AI design principles:

```
Gemini first
OpenAI optional
Appwrite for memory
Minimal context
Controlled tokens
Provider flexibility
```

This architecture ensures GARAS Chat remains:

* scalable
* cost-efficient
* provider-independent
* easy to maintain.
