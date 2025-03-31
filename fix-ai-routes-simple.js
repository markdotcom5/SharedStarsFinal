const fs = require('fs');

const filePath = './routes/aiRoutes.js';

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add the import at the top if it doesn't exist
  if (!content.includes("require('../services/openaiService')")) {
    // Find a good spot to insert the import line
    const lines = content.split('\n');
    let lastImportLine = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('require(') || lines[i].includes('import ')) {
        lastImportLine = i;
      }
    }
    
    // Insert the openaiService import after the last import
    lines.splice(lastImportLine + 1, 0, "const { createChatCompletion } = require('../services/openaiService');");
    content = lines.join('\n');
    
    // Save the modified file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Added openaiService import to aiRoutes.js`);
  } else {
    console.log(`ℹ️ openaiService import already exists in aiRoutes.js`);
  }
} else {
  console.log(`❌ Could not find aiRoutes.js`);
}
