#!/bin/bash

echo "🔄 Fixing critical OpenAI files..."

# List of critical files to fix
critical_files=(
  "./services/STELLA_AI.js"
  "./services/openaiService.js" 
  "./routes/api/stella-qa.js"
  "./routes/api/stella-fixed.js"
)

for file in "${critical_files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    
    # Replace const { OpenAI } = require('openai') with const OpenAI = require('openai')
    sed -i '' 's/const { OpenAI } = require(\x27openai\x27);/const OpenAI = require(\x27openai\x27);/g' "$file"
    
    # Replace with new OpenAI import 
    sed -i '' 's/const { Configuration, OpenAIApi } = require(\x27openai\x27);/const OpenAI = require(\x27openai\x27);/g' "$file"
    
    # Fix deprecated v3 client instantiations
    sed -i '' 's/const configuration = new Configuration({/\/\/ Upgraded OpenAI client\nconst openai = new OpenAI({/g' "$file"
    
    # Replace OpenAIApi instantiation
    sed -i '' 's/const openai = new OpenAIApi(configuration);/\/\/ OpenAI client already initialized above/g' "$file"
  fi
done

echo "✅ Fixed critical OpenAI files"
