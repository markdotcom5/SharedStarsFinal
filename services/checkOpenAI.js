import { checkOpenAiConnection } from './checkOpenAi';

checkOpenAiConnection()
  .then(() => console.log('OpenAI API connected successfully.'))
  .catch(() => console.error('Failed to connect to OpenAI API. Retrying...'));
