import { Groq } from 'groq-sdk';
import { Email, ClassificationResult, AIQueryRequest, AIQueryResponse, SuggestedAction } from '@/types';

// Lazy initialization of Groq client
let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

const CLASSIFICATION_PROMPT = `You are an AI email classifier for a personal assistant managing multiple clients' emails.
Classify each email into EXACTLY ONE of these three categories:

1. **assistant-reply** - The assistant should reply on behalf of the client. These are typically:
   - Routine inquiries, scheduling requests, confirmations
   - Emails where the client has given standing instructions
   - Low-stakes operational emails (meeting confirmations, reminders, etc.)
   - Newsletters/subscriptions the assistant handles

2. **client-reply** - The client MUST reply personally. These are typically:
   - High-stakes decisions requiring client judgment
   - Personal/confidential matters
   - Legal, financial, or strategic decisions
   - Relationship-critical communications
   - Emails explicitly asking for the client's personal input

3. **no-reply** - No response needed. These are typically:
   - Pure notifications (shipping updates, system alerts)
   - FYI/CC emails where client is just informed
   - Marketing/promotional emails
   - Automated reports
   - Already resolved threads

Return ONLY a JSON object with:
{
  "category": "assistant-reply" | "client-reply" | "no-reply",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation (max 2 sentences)",
  "suggestedResponse": "Optional draft response if assistant-reply"
}`;

const QUERY_PROMPT = `You are an AI assistant helping a personal assistant manage emails.
Answer the user's question about the email(s) provided. Be concise, actionable, and professional.
If suggesting actions, return them in the suggestedActions array.`;

export async function classifyEmail(email: Email): Promise<ClassificationResult> {
  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: CLASSIFICATION_PROMPT },
        {
          role: 'user',
          content: `Classify this email:
From: ${email.from}
To: ${email.to}
Subject: ${email.subject}
Body: ${email.body.substring(0, 3000)}
Date: ${email.date}
Labels: ${email.labels.join(', ')}`
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      emailId: email.id,
      category: result.category as ClassificationResult['category'],
      confidence: result.confidence,
      reasoning: result.reasoning,
      suggestedResponse: result.suggestedResponse,
    };
  } catch (error) {
    console.error('Classification error:', error);
    return {
      emailId: email.id,
      category: 'unclassified',
      confidence: 0,
      reasoning: `Classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function batchClassifyEmails(emails: Email[]): Promise<ClassificationResult[]> {
  const results = await Promise.all(
    emails.map(email => classifyEmail(email).catch(err => ({
      emailId: email.id,
      category: 'unclassified' as const,
      confidence: 0,
      reasoning: `Classification failed: ${err.message}`,
    })))
  );
  return results;
}

export async function queryEmails(request: AIQueryRequest): Promise<AIQueryResponse> {
  try {
    const groq = getGroqClient();
    const context = request.context || [];
    const emailContext = context.map(e =>
      `Email ${e.id}: From: ${e.from}, Subject: ${e.subject}, Body: ${e.body.substring(0, 1000)}`
    ).join('\n\n');

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: QUERY_PROMPT },
        {
          role: 'user',
          content: `${request.query}\n\nContext emails:\n${emailContext}`
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      answer: result.answer || 'Unable to process query',
      confidence: result.confidence || 0.5,
      sources: result.sources || [],
      suggestedActions: result.suggestedActions || [],
    };
  } catch (error) {
    console.error('Query error:', error);
    return {
      answer: 'Unable to process query at this time.',
      confidence: 0,
      sources: [],
      suggestedActions: [],
    };
  }
}

export async function generateResponse(email: Email, instruction: string): Promise<string> {
  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a professional personal assistant writing email responses. Be concise, polite, and match the tone of the original email. Return only the response body.'
        },
        {
          role: 'user',
          content: `Write a response to this email:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}
Instruction: ${instruction}`
        },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Generate response error:', error);
    return 'Unable to generate response at this time.';
  }
}