// scripts/populateSpaceJokes.js
/**
 * Populates STELLA's database with space-related jokes and humor
 * This script adds various humor content with appropriate metadata
 */

const mongoose = require('mongoose');
const { createEmbedding } = require('../services/openaiService');
const StellaKnowledge = require('../models/StellaKnowledge');
const fs = require('fs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Collection of space-related jokes and humor
const spaceJokes = [
  {
    content: "Why don't scientists trust atoms? Because they make up everything, even in space!",
    type: "pun",
    topic: "science"
  },
  {
    content: "Why did the astronaut break up with their partner? They needed some space!",
    type: "pun",
    topic: "relationships"
  },
  {
    content: "What do you call an astronaut who's afraid to go back to space? Grounded.",
    type: "wordplay",
    topic: "fear"
  },
  {
    content: "How do you know when the moon is going broke? When it's down to its last quarter!",
    type: "pun",
    topic: "astronomy"
  },
  {
    content: "Why did the astronaut stay at the hotel? It had the best space bar!",
    type: "pun",
    topic: "leisure"
  },
  {
    content: "What kind of music do planets listen to? Nep-tunes!",
    type: "pun",
    topic: "astronomy"
  },
  {
    content: "Did you hear about the astronaut who stepped on chewing gum? They got stuck in orbit!",
    type: "absurd",
    topic: "mishaps"
  },
  {
    content: "How do astronauts organize a party? They planet!",
    type: "pun",
    topic: "social"
  },
  {
    content: "What do you call a fake noodle in space? An impasta-naut!",
    type: "pun",
    topic: "food"
  },
  {
    content: "Why couldn't the astronaut book a room on the moon? It was full!",
    type: "pun",
    topic: "astronomy"
  },
  {
    content: "How does a NASA astronaut change a light bulb? They don't - they just use the sun!",
    type: "situational",
    topic: "everyday"
  },
  {
    content: "I was going to tell a joke about space, but it was too out of this world.",
    type: "meta",
    topic: "humor"
  },
  {
    content: "What's an astronaut's favorite button on the keyboard? The space bar!",
    type: "pun",
    topic: "technology"
  },
  {
    content: "Why don't aliens visit our solar system? They read the reviews: 'Mostly harmless, but one planet has humans. 1 star.'",
    type: "situational",
    topic: "aliens"
  },
  {
    content: "What do you call a space cow? A moooooooooooon!",
    type: "pun",
    topic: "animals"
  },
  {
    content: "How do astronauts sleep? They space out.",
    type: "pun",
    topic: "everyday"
  },
  {
    content: "What did Mars say to Saturn? Give me a ring sometime!",
    type: "pun",
    topic: "astronomy"
  },
  {
    content: "Why don't astronomers tell jokes while observing? It might trigger a big bang of laughter!",
    type: "wordplay",
    topic: "science"
  },
  {
    content: "I wanted to be an astronaut, but my parents said it was just a phase. Turns out I was just waxing and waning.",
    type: "wordplay",
    topic: "career"
  },
  {
    content: "In space, no one can hear you laugh. But they can definitely see your zero-gravity milk floating everywhere if you're eating cereal.",
    type: "observational",
    topic: "eating"
  },
  {
    content: "Why did the astronaut bring a ladder to space? They wanted to visit the high frontier!",
    type: "pun",
    topic: "exploration"
  },
  {
    content: "How do astronauts stay in shape in space? They planet!",
    type: "pun",
    topic: "fitness"
  },
  {
    content: "Training for zero gravity? Just think of it as falling with style!",
    type: "reference",
    topic: "training"
  },
  {
    content: "Astronaut training is tough, but I hear the graduation ceremony is out of this world!",
    type: "pun",
    topic: "training"
  },
  {
    content: "What's an astronaut's favorite place on the computer? The Space bar!",
    type: "pun",
    topic: "technology"
  },
  {
    content: "What's an astronaut's favorite key on the keyboard? The space bar!",
    type: "pun",
    topic: "technology"
  },
  {
    content: "What does an astronaut do when they're angry? They rocket!",
    type: "pun",
    topic: "emotions"
  },
  {
    content: "Before I begin my space travel, I need to check my launch list.",
    type: "pun",
    topic: "preparation"
  },
  {
    content: "I told my crew I was going to be the first astronaut on Mars. They said I was going to planetwrong.",
    type: "pun",
    topic: "ambition"
  },
  {
    content: "I wanted to be a better astronaut, so I went to space camp. It was an out-of-this-world experience!",
    type: "pun",
    topic: "training"
  },
  // New enhanced jokes
  {
    content: "How do you throw a party in space? You planet!",
    type: "pun",
    topic: "social"
  },
  {
    content: "What's a spacewalker's favorite movie? Gravity, but they think the ending is a bit of a letdown.",
    type: "observational",
    topic: "entertainment"
  },
  {
    content: "How do astronauts brush their teeth in space? With orbit cleaner!",
    type: "pun",
    topic: "hygiene"
  },
  {
    content: "What did the meteorite say to Earth? 'I'm really falling for you!'",
    type: "pun",
    topic: "astronomy"
  },
  {
    content: "Why did the space rock taste better than the Earth rock? It was a little meteor!",
    type: "pun",
    topic: "food"
  }
];

// Function to generate embeddings for a joke
async function generateEmbedding(content) {
  try {
    const embedding = await createEmbedding(content);
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Function to create a joke question from content
function createJokeQuestion(content) {
  // Extract the setup part for question-type jokes
  if (content.includes('?')) {
    const setup = content.split('?')[0] + '?';
    return setup;
  }
  
  // For other jokes, create a generic question based on topic
  if (content.toLowerCase().includes('astronaut')) {
    return "Tell me a joke about astronauts?";
  } else if (content.toLowerCase().includes('planet')) {
    return "Do you know any planet jokes?";
  } else if (content.toLowerCase().includes('moon')) {
    return "Got any moon jokes?";
  } else if (content.toLowerCase().includes('space')) {
    return "Can you tell me a space joke?";
  }
  
  // Default question
  return "Tell me a space joke?";
}

// Function to determine humor intensity based on joke type
function getHumorIntensity(jokeType) {
  switch(jokeType) {
    case 'pun':
      return [60, 80]; // Medium-high humor
    case 'absurd':
      return [80, 100]; // High humor
    case 'observational':
      return [50, 70]; // Medium humor
    case 'wordplay':
      return [65, 85]; // Medium-high humor
    case 'meta':
      return [70, 90]; // High humor
    case 'reference':
      return [60, 80]; // Medium-high humor
    case 'situational':
      return [55, 75]; // Medium humor
    default:
      return [67, 100]; // Default high humor
  }
}

// Function to save a joke to the database
async function saveJoke(joke) {
  try {
    // Generate embedding for the joke
    const embedding = await generateEmbedding(joke.content);
    
    // Create a question from the joke content
    const question = createJokeQuestion(joke.content);
    
    // Determine humor intensity range
    const intensityRange = getHumorIntensity(joke.type);
    
    // Create or update the document in the database
    const jokeDoc = new StellaKnowledge({
      // Add required question field
      question: question,
      content: joke.content,
      embedding: embedding,
      category: 'personality',
      subcategory: 'humor',
      intensityRange: intensityRange,
      contextTags: [joke.topic, joke.type, 'humor', 'joke', 'space'],
      contentType: 'joke',
      metadata: {
        jokeType: joke.type,
        topic: joke.topic,
        dateAdded: new Date()
      }
    });
    
    await jokeDoc.save();
    console.log(`✅ Saved joke: ${joke.content.substring(0, 50)}...`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error saving joke:`, error);
    return false;
  }
}

// Function to check for duplicate jokes
function removeDuplicates(jokes) {
  const uniqueJokes = [];
  const contentSet = new Set();
  
  for (const joke of jokes) {
    // Normalize the joke content for comparison
    const normalizedContent = joke.content.toLowerCase().trim();
    
    if (!contentSet.has(normalizedContent)) {
      contentSet.add(normalizedContent);
      uniqueJokes.push(joke);
    }
  }
  
  return uniqueJokes;
}

// Main function to populate all jokes
async function populateSpaceJokes() {
  console.log('🚀 Starting space jokes population...');
  
  // Remove duplicates first
  const uniqueJokes = removeDuplicates(spaceJokes);
  console.log(`Found ${spaceJokes.length} jokes, ${uniqueJokes.length} are unique`);
  
  // Track success/failure stats
  let successCount = 0;
  let failureCount = 0;
  
  // Process each joke
  for (const joke of uniqueJokes) {
    const success = await saveJoke(joke);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
    
    // Brief pause to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Save stats to log file
  const stats = {
    totalJokes: uniqueJokes.length,
    successfulSaves: successCount,
    failedSaves: failureCount,
    timestamp: new Date().toISOString()
  };
  
  // Make sure logs directory exists
  if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs', { recursive: true });
  }
  
  fs.writeFileSync('./logs/jokes-import.json', JSON.stringify(stats, null, 2));
  
  console.log(`
🎭 Space Jokes Population Complete
-----------------------------------
Total Jokes Processed: ${uniqueJokes.length}
Successfully Saved: ${successCount}
Failed: ${failureCount}
  `);
  
  console.log('🏁 Finished populating space jokes!');
  mongoose.disconnect();
}

// Run the population script
populateSpaceJokes().catch(error => {
  console.error('❌ Error in space jokes script:', error);
  mongoose.disconnect();
  process.exit(1);
});