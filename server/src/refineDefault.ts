export const DEFAULT_REFINE_CONTEXT = `### The Anatomy of a Perfect Prompt
A high-quality prompt is essentially a professional creative brief consisting of five core components that provide identity, context, and clear boundaries.

1.  **Role & Goal:** Define who the AI is and what it needs to achieve. Establishing a complete identity is more effective than simple "act as" prompts.
2.  **Knowledge Base:** Specify the depth of expertise, years of experience, and specific domains the AI should draw from. Specificity here aligns the model with statistically relevant tokens in its training data.
3.  **Tone & Style:** Describe the communication mode—concise, professional, skeptical, or conversational—and specify any required industry-specific terminology.
4.  **Constraints:** Explicitly define what the AI **must not** do. This is often the most critical part for reducing ambiguity and "AI fluff".
5.  **Example Output:** Provide a "gold standard" snippet of what a good response looks like to guide the model's formatting and logic.

---

### Advanced Logic & Workflow
For complex tasks, the "Anatomy" should be expanded with a modular scaffold to increase predictability:

*   **Workflow / Planning Induction:** Force the model to plan its response by including instructions like **"Think carefully step by step"** before it begins writing.
*   **Delimiters:** Use Markdown headers (\`#\`) or XML tags (\`<doc>\`) to clearly separate different instructions, documents, or data segments within the prompt.
*   **Reasoning Strategy:** Tell the AI *how* to think through the problem (e.g., "Analyze the query, select context, then synthesize an answer").
*   **Targeted Constraints:** Use "harsh rules" to prevent AI bloat, such as forbidding specific words (e.g., "leverage," "seamless," "robust") or requiring the output length to stay within ±10% of a provided sample.

---

### Good Examples

#### Example 1: Professional Persona (Venture Capitalist)
> **Role & Goal:** You are a Silicon Valley venture capitalist. Your goal is to review this pitch and decide if it's worth a $1M seed investment.
> **Knowledge:** You have 20 years of experience, have reviewed 5,000 pitches, and have deep expertise in B2B SaaS.
> **Tone:** Skeptical but fair, professional, and focuses on fundamentals like market size and traction.
> **Constraints:** Do NOT give vague positive feedback. Point out at least 3 major weaknesses. Do not summarize the pitch. Keep response under 300 words.
> **Example:** A good analysis looks like this: 'Team: Strong, but lacks a technical co-founder...'.

#### Example 2: Content Writing Brief
> **Role & Goal:** Professional content writer tasked with a 1,000-word blog post that converts readers into email subscribers.
> **Knowledge:** Expertise in SEO, reader psychology, and conversion copywriting.
> **Constraints:** No fluff or repetition. Include subheadings every 200 words. Avoid questions as the first sentence.
> **Workflow:** 1. Create a tight outline. 2. Identify the #1 takeaway. 3. Write the draft strictly following the outline [Source 1 excerpt].

---

### The Dos and Don'ts

| **Dos** | **Don'ts** |
| :--- | :--- |
| **Be Specific:** Detailed prompts lead to nuanced, high-performance answers. | **Avoid Vague Requests:** Simply asking the AI to "write something" guarantees generic results. |
| **Give Input:** The AI cannot invent your specific insights; provide notes, data, or drafts for it to analyze. | **Don't Use Long Threads:** Avoid long chats with multiple topic changes, which can confuse the model and cause hallucinations. |
| **Start New Chats:** Open a fresh chat for every new topic to prevent "drift" from previous context. | **Don't Trust Without Verifying:** AI is convincing even when it is wrong. Always fact-check the output. |
| **Use Forbiddance:** Explicitly ban hype-words or phrases you dislike to improve readability instantly. | **Don't Settle for One-Pass:** For high-quality work, treat planning, writing, and polishing as separate tasks/passes. |
| **Induce Reasoning:** Frame the task with "Think step by step" to force better logic. | **Avoid "Runic" Rituals:** LLMs love structure but don't need excessive "decoration"; keep definitions deterministic. |`;
