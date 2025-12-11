import express from 'express';
import cors from 'cors';
import { config } from './config';
import { generateReply, ResponseType } from './anthropicClient';

const app = express();

app.use(cors());
app.use(express.json());

// Health check for Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

interface GenerateReplyBody {
  selectedText?: string;
  responseType?: ResponseType;
  userPrompt?: string;
}

const VALID_RESPONSE_TYPES: ResponseType[] = [
  'cheerleader',
  'gentle_critic',
  'thoughtful_peer',
  'practitioner',
  'curious_collaborator',
  'polished_professional',
  'appreciative_contrarian',
  'story_sharer',
  'energized_builder',
  'networker',
];

app.post('/generate-reply', async (req, res) => {
  const { selectedText, responseType, userPrompt } = req.body as GenerateReplyBody;

  if (!selectedText || typeof selectedText !== 'string') {
    res.status(400).json({ error: 'selectedText is required and must be a string' });
    return;
  }

  if (!responseType || !VALID_RESPONSE_TYPES.includes(responseType)) {
    res.status(400).json({
      error: `responseType is required and must be one of: ${VALID_RESPONSE_TYPES.join(', ')}`,
    });
    return;
  }

  try {
    const reply = await generateReply({
      selectedText,
      responseType,
      userPrompt,
    });

    res.json({ reply });
  } catch (err) {
    console.error('Error generating reply:', err);
    res.status(500).json({ error: 'Failed to generate reply' });
  }
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
