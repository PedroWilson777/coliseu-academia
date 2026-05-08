import Anthropic from '@anthropic-ai/sdk';
import { prisma } from './prisma';
import { buildAtenaSystemPrompt } from './atena-prompt';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

export interface AtenaResponse {
  text: string;
  metaTags: MetaTag[];
  raw: string;
}

export interface MetaTag {
  type: 'EXPERIMENTAL' | 'ENVIAR_PLANOS' | 'FECHAMENTO' | 'ESCALAR' | string;
  params: Record<string, string>;
}

export async function askAtena(
  conversationId: string,
  isStudent: boolean = false,
  studentName?: string
): Promise<AtenaResponse> {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 30,
  });

  const apiMessages: { role: 'user' | 'assistant'; content: string }[] = messages.map(m => ({
    role: m.sender === 'CLIENT' ? 'user' : 'assistant',
    content: m.audioTranscript ? `[áudio transcrito]: ${m.audioTranscript}` : m.content,
  }));

  const systemPrompt = await buildAtenaSystemPrompt(isStudent, studentName);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: systemPrompt,
    messages: apiMessages,
  });

  const rawText = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('\n');

  const metaTags = extractMetaTags(rawText);
  const cleanText = rawText.replace(/\[META:[^\]]+\]/g, '').trim();

  return { text: cleanText, metaTags, raw: rawText };
}

function extractMetaTags(text: string): MetaTag[] {
  const regex = /\[META:([^\]]+)\]/g;
  const tags: MetaTag[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const parts = match[1].split('|');
    const type = parts[0].trim();
    const params: Record<string, string> = {};

    for (let i = 1; i < parts.length; i++) {
      const [key, ...valueParts] = parts[i].split('=');
      if (key) params[key.trim()] = valueParts.join('=').trim();
    }

    tags.push({ type, params });
  }

  return tags;
}
