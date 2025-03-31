const fs = require('fs');
const path = require('path');

// Files that import bcrypt
const files = [
  './models/User.js',
  './routes/signup.js',
  './routes/user.js',
  './scripts/generate-token.js',
  './scripts/hashPassword.js',
  './services/addTestUser.js',
  './services/updatePassword.js'
];

files.forEach(file => {
  try {
    const filePath = path.resolve(file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(
        /const bcrypt = require\(['"]bcrypt['"]\);/g,
        "const bcrypt = require('../mockBcrypt'); // Temporary mock"
      );
      fs.writeFileSync(filePath, content);
      console.log(`Updated: ${file}`);
    } else {
      console.log(`File not found: ${file}`);
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
  }
});

console.log('Done replacing bcrypt imports');
