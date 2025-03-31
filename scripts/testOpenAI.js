const { createChatCompletion, createEmbedding } = require('../services/openaiService');

async function test() {
  try {
    const chatResult = await createChatCompletion([{ role: "user", content: "Hello!" }]);
    console.log('✅ OpenAI Chat:', chatResult);

    const embeddingResult = await createEmbedding("Test embedding text");
    console.log('✅ OpenAI Embedding length:', embeddingResult.length);
  } catch (error) {
    console.error('❌ Test Failed:', error);
  }
}

test();
