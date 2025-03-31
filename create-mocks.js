const fs = require('fs');
const path = require('path');

// Create directory if it doesn't exist
const createDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
};

// Create mock files for missing dependencies
const mocks = [
  {
    path: './mocks/bcrypt.js',
    content: `// Mock bcrypt implementation
module.exports = {
  hash: (password, saltRounds) => Promise.resolve(\`hashed_\${password}\`),
  compare: (password, hash) => Promise.resolve(hash === \`hashed_\${password}\`),
  genSalt: (rounds) => Promise.resolve('mocksalt')
};`
  },
  {
    path: './mocks/openai.js',
    content: `// Mock OpenAI implementation
class OpenAI {
  constructor(config) {
    this.apiKey = config.apiKey;
    console.log('Mock OpenAI initialized with API key:', this.apiKey ? 'Valid key provided' : 'No key');
  }

  async chat(options) {
    return {
      choices: [{
        message: {
          content: "This is a mock response from the OpenAI service. The real service is not available."
        }
      }]
    };
  }

  async completions(options) {
    return {
      choices: [{
        text: "This is a mock response from the OpenAI service. The real service is not available."
      }]
    };
  }
}

module.exports = { OpenAI };`
  }
];

// Files that need to be modified
const replacements = [
  {
    file: './services/openaiService.js',
    pattern: /require\(['"]openai['"]\)/g,
    replacement: "require('../mocks/openai')"
  },
  {
    file: './models/User.js',
    pattern: /const bcrypt = require\(['"]bcrypt['"]\);/g,
    replacement: "const bcrypt = require('../mocks/bcrypt');"
  },
  {
    file: './routes/signup.js',
    pattern: /const bcrypt = require\(['"]bcrypt['"]\);/g,
    replacement: "const bcrypt = require('../mocks/bcrypt');"
  },
  {
    file: './routes/user.js',
    pattern: /const bcrypt = require\(['"]bcrypt['"]\);/g,
    replacement: "const bcrypt = require('../mocks/bcrypt');"
  },
  {
    file: './scripts/generate-token.js',
    pattern: /const bcrypt = require\(['"]bcrypt['"]\);/g,
    replacement: "const bcrypt = require('../mocks/bcrypt');"
  },
  {
    file: './scripts/hashPassword.js',
    pattern: /const bcrypt = require\(['"]bcrypt['"]\);/g,
    replacement: "const bcrypt = require('../mocks/bcrypt');"
  },
  {
    file: './services/addTestUser.js',
    pattern: /const bcrypt = require\(['"]bcrypt['"]\);/g,
    replacement: "const bcrypt = require('../mocks/bcrypt');"
  },
  {
    file: './services/updatePassword.js',
    pattern: /const bcrypt = require\(['"]bcrypt['"]\);/g,
    replacement: "const bcrypt = require('../mocks/bcrypt');"
  }
];

// Create mock files
createDir('./mocks');
mocks.forEach(mock => {
  try {
    fs.writeFileSync(mock.path, mock.content);
    console.log(`Created mock: ${mock.path}`);
  } catch (err) {
    console.error(`Error creating ${mock.path}:`, err);
  }
});

// Apply replacements
replacements.forEach(item => {
  try {
    const filePath = path.resolve(item.file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const updatedContent = content.replace(item.pattern, item.replacement);
      
      if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent);
        console.log(`Updated: ${item.file}`);
      } else {
        console.log(`No changes needed in: ${item.file}`);
      }
    } else {
      console.log(`File not found: ${item.file}`);
    }
  } catch (err) {
    console.error(`Error processing ${item.file}:`, err);
  }
});

console.log('Done creating mocks and updating imports');
