#!/bin/bash

# Correct OpenAI initialization everywhere
echo "🔄 Finding and replacing incorrect OpenAI imports..."

# Replace const { OpenAI } = require('openai') with const OpenAI = require('openai')
find . -type f -name "*.js" -exec sed -i '' \
    's/const { OpenAI } = require(\x27openai\x27);/const OpenAI = require(\x27openai\x27);/g' {} \;

# Replace with new OpenAI import 
find . -type f -name "*.js" -exec sed -i '' \
    's/const { Configuration, OpenAIApi } = require(\x27openai\x27);/const OpenAI = require(\x27openai\x27);/g' {} \;

# Fix deprecated v3 client instantiations
find . -type f -name "*.js" -exec sed -i '' \
    's/const configuration = new Configuration({/\/\/ Upgraded OpenAI client\nconst openai = new OpenAI({/g' {} \;

# Remove extra lines from old config
find . -type f -name "*.js" -exec sed -i '' \
    's/apiKey: process.env.OPENAI_API_KEY,\n});/apiKey: process.env.OPENAI_API_KEY\n});/g' {} \;

# Replace OpenAIApi instantiation
find . -type f -name "*.js" -exec sed -i '' \
    's/const openai = new OpenAIApi(configuration);/\/\/ OpenAI client already initialized above/g' {} \;

# Replace ActualOpenAI
find . -type f -name "*.js" -exec sed -i '' \
    's/const openai = new ActualOpenAI/const openai = new OpenAI/g' {} \;

# Replace any other variant names
find . -type f -name "*.js" -exec sed -i '' \
    's/new OpenAIClient/new OpenAI/g' {} \;

echo "✅ All OpenAI initializations have been fixed!"
echo "📝 Note: You may need to manually review files for any edge cases this script couldn't handle."
