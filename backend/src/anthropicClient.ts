import Anthropic from '@anthropic-ai/sdk';
import { config } from './config';

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
});

export type ResponseType =
  | 'cheerleader'
  | 'gentle_critic'
  | 'thoughtful_peer'
  | 'practitioner'
  | 'curious_collaborator'
  | 'polished_professional'
  | 'appreciative_contrarian'
  | 'story_sharer'
  | 'energized_builder'
  | 'networker';

export interface GenerateReplyParams {
  selectedText: string;
  responseType: ResponseType;
  userPrompt?: string;
}

const RESPONSE_TYPE_INSTRUCTIONS: Record<ResponseType, string> = {
  cheerleader:
    'Generate a short LinkedIn comment in a warm, enthusiastic "cheerleader" tone. Sound like a real human who genuinely appreciates the post. Avoid clichés and keep it conversational, not exaggerated.',
  gentle_critic:
    'Generate a short LinkedIn comment that is friendly and respectful but adds gentle, constructive pushback. Acknowledge what works, then offer a missed nuance or open question. Sound human, not formal.',
  thoughtful_peer:
    'Create a short, thoughtful LinkedIn comment that agrees with the post and adds a reflective point or personal observation. Keep it grounded and conversational.',
  practitioner:
    'Generate a concise LinkedIn comment that sounds like someone speaking from firsthand experience. Relate the post to something practical without oversharing. Human, grounded tone.',
  curious_collaborator:
    'Write a short LinkedIn comment that shows genuine curiosity and asks a thoughtful follow-up question. Keep the tone warm, human, and collaborative.',
  polished_professional:
    'Generate a clean, concise LinkedIn comment in a professional but human tone. No corporate buzzwords unless they naturally fit.',
  appreciative_contrarian:
    'Write a LinkedIn comment that acknowledges the value of the post but respectfully disagrees with part of it, adding a constructive alternative viewpoint. Make it sound human and grounded, not argumentative.',
  story_sharer:
    'Generate a brief LinkedIn comment that contains a short, relevant anecdote. Keep it tight, human, and authentic—not overly dramatic.',
  energized_builder:
    'Write a LinkedIn comment that acknowledges the insight and shifts toward what\'s possible next. Keep it optimistic but grounded, human but not gushy.',
  networker:
    'Generate a brief LinkedIn comment that expresses interest in continuing the conversation or learning more from the author. Tone should be warm, human, and not salesy.',
};

const SYSTEM_PROMPT = `You help write professional LinkedIn responses. Keep them concise (1-3 sentences), natural, and suitable as a direct post/comment. Avoid hashtags unless requested. Return only the reply text with no preamble or meta-commentary.`;

export async function generateReply(
  params: GenerateReplyParams
): Promise<string> {
  const { selectedText, responseType, userPrompt } = params;

  const typeInstruction = RESPONSE_TYPE_INSTRUCTIONS[responseType];

  let userMessage = `Here is the LinkedIn post or comment to respond to:

"""
${selectedText}
"""

${typeInstruction}`;

  if (userPrompt) {
    userMessage += `\n\nAdditional style instructions: ${userPrompt}`;
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Anthropic');
  }

  return textBlock.text;
}
