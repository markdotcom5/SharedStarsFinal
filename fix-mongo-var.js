const fs = require('fs');
const path = require('path');

// Files to check for MongoDB connection strings
const filesToCheck = [
  './app.js',
  './config.js',
  './config/index.js',
  './db/connection.js'
];

console.log('🔄 Fixing MongoDB URI variable references...');

filesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`Checking ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    let wasModified = false;
    
    // Check for mongoose.connect with process.env.MONGO_URI
    if (content.includes('mongoose.connect(process.env.MONGO_URI)')) {
      content = content.replace(
        'mongoose.connect(process.env.MONGO_URI)',
        'mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)'
      );
      wasModified = true;
    }
    
    // Check for other mongoose.connect patterns
    if (content.includes('mongoose.connect(') && content.includes('MONGO_URI')) {
      content = content.replace(
        /mongoose\.connect\(\s*process\.env\.MONGO_URI/g,
        'mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI'
      );
      wasModified = true;
    }
    
    // Add environment variable fallback
    if (content.includes('dotenv.config()') && !content.includes('MONGO_URI = process.env.MONGODB_URI')) {
      const dotenvLine = content.indexOf('dotenv.config()');
      const insertPosition = content.indexOf('\n', dotenvLine) + 1;
      
      const fallbackCode = `
// Ensure MongoDB URI compatibility
if (!process.env.MONGO_URI && process.env.MONGODB_URI) {
  process.env.MONGO_URI = process.env.MONGODB_URI;
  console.log("✅ Added MONGO_URI alias for MONGODB_URI");
}
`;
      
      content = content.slice(0, insertPosition) + fallbackCode + content.slice(insertPosition);
      wasModified = true;
    }
    
    if (wasModified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed MongoDB URI references in ${filePath}`);
    }
  }
});

console.log('✅ MongoDB URI fix completed');
