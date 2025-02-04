// test/setup.js
jest.mock('openai', () => ({
    OpenAI: jest.fn()
  }));