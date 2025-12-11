import dotenv from 'dotenv';

dotenv.config();

interface Config {
  anthropicApiKey: string;
  port: number;
}

function loadConfig(): Config {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  return {
    anthropicApiKey,
    port: parseInt(process.env.PORT || '3000', 10),
  };
}

export const config = loadConfig();
