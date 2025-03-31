const fs = require('fs');
const path = require('path');

console.log('🔄 Fixing aiRoutes.js...');

// Find aiRoutes.js - try multiple possible locations
const possiblePaths = [
  './routes/aiRoutes.js',
  './routes/api/aiRoutes.js',
  './api/routes/aiRoutes.js'
];

let aiRoutesPath = null;
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    aiRoutesPath = testPath;
    console.log(`Found aiRoutes.js at: ${testPath}`);
    break;
  }
}

if (!aiRoutesPath) {
  console.log('❌ Could not find aiRoutes.js. Checking for similar files...');
  
  // Try to find any file with "ai" and "routes" in the name
  const routesDirs = ['./routes', './routes/api', './api/routes'];
  for (const dir of routesDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.toLowerCase().includes('ai') && file.endsWith('.js')) {
          aiRoutesPath = path.join(dir, file);
          console.log(`Found possible match: ${aiRoutesPath}`);
          break;
        }
      }
    }
    if (aiRoutesPath) break;
  }
}

if (aiRoutesPath && fs.existsSync(aiRoutesPath)) {
  let content = fs.readFileSync(aiRoutesPath, 'utf8');
  let wasModified = false;
  
  // Look for the problematic pattern with STELLA_AI.openai
  if (content.includes('STELLA_AI.openai')) {
    console.log('Found problematic STELLA_AI.openai reference.');
    
    // Replace with centralized service
    const newContent = content.replace(
      /if\s*\(\s*STELLA_AI\s*&&\s*STELLA_AI\.openai\s*\)\s*{[\s\S]*?const\s+response\s*=\s*await\s+STELLA_AI\.openai\.chat\.completions\.create\(\s*{[\s\S]*?model\s*:\s*STELLA_AI\.config\.model\s*,[\s\S]*?messages\s*:/g,
      `// Use centralized openaiService for space/physical training questions
  const { createChatCompletion } = require('../services/openaiService');
  try {
    const response = await createChatCompletion(`
    );
    
    if (content !== newContent) {
      fs.writeFileSync(aiRoutesPath, newContent, 'utf8');
      console.log(`✅ Fixed ${aiRoutesPath} to use centralized openaiService`);
      wasModified = true;
    }
  }
  
  // More general fix if the specific pattern wasn't found
  if (!wasModified && content.includes('OpenAI')) {
    console.log('Applying general OpenAI import fix...');
    
    // Add proper import at the top
    if (!content.includes("require('../services/openaiService')")) {
      const importLine = "const { createChatCompletion } = require('../services/openaiService');";
      const lines = content.split('\n');
      
      // Find the right spot to insert the import
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('require(') || lines[i].includes('import ')) {
          insertIndex = i + 1;
        }
      }
      
      // Insert the import
      lines.splice(insertIndex, 0, importLine);
      content = lines.join('\n');
      
      // Replace any direct OpenAI usage
      content = content.replace(/new\s+OpenAI\(/g, '/* Use centralized service */ new OpenAI(');
      content = content.replace(/openai\.chat\.completions\.create/g, 'createChatCompletion');
      
      fs.writeFileSync(aiRoutesPath, content, 'utf8');
      console.log(`✅ Added openaiService import to ${aiRoutesPath}`);
      wasModified = true;
    }
  }
  
  if (!wasModified) {
    console.log('⚠️ No changes made to the file. Manual review needed.');
  }
} else {
  console.log('❌ Could not find aiRoutes.js at expected paths. Manual fix required.');
}
