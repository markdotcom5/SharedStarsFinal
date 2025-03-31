// scripts/scrapeSpaceContent.js
/**
 * Scrapes space-related information from public sources
 * and adds content to STELLA's knowledge base
 * Enhanced with international space agencies
 */

const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const { createEmbedding } = require('../services/openaiService');
const StellaKnowledge = require('../models/StellaKnowledge');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Global space agencies and content sources
const sources = [
  // NASA (USA)
  { 
    url: 'https://www.nasa.gov/humans-in-space/', 
    type: 'missions',
    title: 'NASA: Humans in Space',
    agency: 'NASA'
  },
  { 
    url: 'https://www.nasa.gov/nasa-astronauts/', 
    type: 'career',
    title: 'NASA: Astronauts',
    agency: 'NASA'
  },
  { 
    url: 'https://www.nasa.gov/international-space-station/', 
    type: 'missions',
    title: 'NASA: International Space Station',
    agency: 'NASA'
  },
  { 
    url: 'https://www.nasa.gov/artemis/', 
    type: 'missions',
    title: 'NASA: Artemis Program',
    agency: 'NASA'
  },
  { 
    url: 'https://www.nasa.gov/directorates/space-operations-mission-directorate/', 
    type: 'training',
    title: 'NASA: Space Operations',
    agency: 'NASA'
  },
  
  // ESA (European Space Agency)
  {
    url: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Astronauts', 
    type: 'training',
    title: 'ESA: Astronauts',
    agency: 'ESA'
  },
  {
    url: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/European_astronaut_selection', 
    type: 'requirements',
    title: 'ESA: Astronaut Selection',
    agency: 'ESA'
  },
  {
    url: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Astronauts/The_way_to_becoming_an_astronaut', 
    type: 'career',
    title: 'ESA: Becoming an Astronaut',
    agency: 'ESA'
  },
  {
    url: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/International_Space_Station', 
    type: 'missions',
    title: 'ESA: International Space Station',
    agency: 'ESA'
  },
  
  // CNSA (China National Space Administration)
  {
    url: 'http://www.cnsa.gov.cn/english/n6465652/n6465653/index.html', 
    type: 'missions',
    title: 'CNSA: China Manned Space Program',
    agency: 'CNSA'
  },
  {
    url: 'http://www.cnsa.gov.cn/english/n6465633/index.html', 
    type: 'missions',
    title: 'CNSA: Latest News',
    agency: 'CNSA'
  },
  
  // KARI (Korea Aerospace Research Institute)
  {
    url: 'https://www.kari.re.kr/eng/sub05_04.do', 
    type: 'astronauts',
    title: 'KARI: Korean Astronauts',
    agency: 'KARI'
  },
  {
    url: 'https://www.kari.re.kr/eng/sub05_01.do', 
    type: 'missions',
    title: 'KARI: Space Programs',
    agency: 'KARI'
  },
  
  // JAXA (Japan Aerospace Exploration Agency)
  {
    url: 'https://global.jaxa.jp/projects/humans/', 
    type: 'missions',
    title: 'JAXA: Human Space Activities',
    agency: 'JAXA'
  },
  {
    url: 'https://global.jaxa.jp/about/jaxatoday/interviews/vol82/', 
    type: 'astronauts',
    title: 'JAXA: Astronaut Interviews',
    agency: 'JAXA'
  },
  
  // CSA (Canadian Space Agency)
  {
    url: 'https://www.asc-csa.gc.ca/eng/astronauts/how-to-become-an-astronaut/requirements-and-conditions.asp', 
    type: 'requirements',
    title: 'CSA: Astronaut Requirements',
    agency: 'CSA'
  },
  {
    url: 'https://www.asc-csa.gc.ca/eng/astronauts/canadian/default.asp', 
    type: 'astronauts',
    title: 'CSA: Canadian Astronauts',
    agency: 'CSA'
  },
  
  // ISRO (Indian Space Research Organisation)
  {
    url: 'https://www.isro.gov.in/Gaganyaan.html', 
    type: 'missions',
    title: 'ISRO: Gaganyaan - Indian Human Spaceflight Programme',
    agency: 'ISRO'
  },
  {
    url: 'https://www.isro.gov.in/human-space-flight.html', 
    type: 'training',
    title: 'ISRO: Human Spaceflight',
    agency: 'ISRO'
  },
  
  // Roscosmos (Russian Space Agency)
  {
    url: 'https://www.roscosmos.ru/203/', 
    type: 'astronauts',
    title: 'Roscosmos: Cosmonauts',
    agency: 'Roscosmos'
  }
];

// Function to generate embeddings
async function generateEmbedding(content) {
  try {
    const embedding = await createEmbedding(content);
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Function to process text: remove extra spaces, normalize whitespace, and clean up HTML artifacts
function processText(text) {
  return text
    .replace(/\s+/g, ' ')                  // Replace multiple spaces with a single space
    .replace(/\n+/g, '\n')                 // Replace multiple newlines with a single newline
    .replace(/\t+/g, ' ')                  // Replace tabs with spaces
    .replace(/\[\s*\d+\s*\]/g, '')         // Remove reference numbers like [1], [2], etc.
    .replace(/\{.*?\}/g, '')               // Remove curly braces and their contents
    .replace(/javascript:|<script.*?>.*?<\/script>/gsi, '') // Remove JavaScript code
    .replace(/<style.*?>.*?<\/style>/gsi, '')  // Remove CSS styling
    .replace(/<.*?>/g, ' ')                // Remove HTML tags
    .replace(/&nbsp;/g, ' ')               // Replace &nbsp; with space
    .replace(/&lt;/g, '<')                 // Replace &lt; with <
    .replace(/&gt;/g, '>')                 // Replace &gt; with >
    .replace(/&amp;/g, '&')                // Replace &amp; with &
    .replace(/&quot;/g, '"')               // Replace &quot; with "
    .replace(/&apos;/g, "'")               // Replace &apos; with '
    .replace(/\s+/g, ' ')                  // Clean up again after all replacements
    .trim();                               // Remove leading/trailing spaces
}

// Function to extract title from webpage
function extractTitle($) {
  let title = $('title').text().trim();
  
  // Clean up title
  title = title
    .replace(/ - NASA$/, '')
    .replace(/ \| NASA$/, '')
    .replace(/ \| Space$/, '')
    .replace(/ \| ESA$/, '')
    .replace(/ - JAXA$/, '')
    .replace(/ - ISRO$/, '')
    .replace(/ - KARI$/, '')
    .replace(/ - CSA-ASC$/, '');
    
  return title;
}

// Function to extract meaningful paragraphs
function extractParagraphs($) {
  const paragraphs = [];
  
  // Target selectors for paragraphs, ordered by priority
  const selectors = [
    'article p',
    '.content p',
    'main p',
    '.post-content p',
    '#main-content p',
    '.article-body p',
    '.entry-content p',
    '.wysiwyg-content p',
    '.nasa-wysiwyg-content p',
    '.node__content p',
    '.article p',
    '.main-content p',
    '.view-content p',
    'section p',
    '.page-section p',
    '.right-content p',
    '#content p',
    'p'  // Fallback to all paragraphs
  ];
  
  // Try each selector until we find paragraphs
  for (const selector of selectors) {
    $(selector).each((index, element) => {
      const text = $(element).text().trim();
      if (text.length > 50) {  // Only grab substantial paragraphs
        paragraphs.push(text);
      }
    });
    
    // If we found meaningful paragraphs, stop searching
    if (paragraphs.length > 5) {
      break;
    }
  }
  
  return paragraphs;
}

// Function to split text into paragraphs
function splitIntoParagraphs(text, maxLength = 1000) {
  // First, split by obvious paragraph breaks
  const paragraphs = text.split(/\n\n+/);
  
  const result = [];
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // Skip empty paragraphs
    if (paragraph.trim().length === 0) continue;
    
    // If this paragraph would fit within the current chunk, add it
    if (currentChunk.length + paragraph.length + 2 <= maxLength) {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    } else {
      // If the current chunk is not empty, add it to results
      if (currentChunk) {
        result.push(currentChunk);
      }
      
      // If the paragraph itself is too long, split it by sentences
      if (paragraph.length > maxLength) {
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        let sentenceChunk = '';
        
        for (const sentence of sentences) {
          if (sentenceChunk.length + sentence.length + 1 <= maxLength) {
            sentenceChunk += (sentenceChunk ? ' ' : '') + sentence;
          } else {
            if (sentenceChunk) {
              result.push(sentenceChunk);
            }
            sentenceChunk = sentence;
          }
        }
        
        if (sentenceChunk) {
          currentChunk = sentenceChunk;
        } else {
          currentChunk = '';
        }
      } else {
        // Start a new chunk with this paragraph
        currentChunk = paragraph;
      }
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk) {
    result.push(currentChunk);
  }
  
  return result;
}

// Generate a relevant question for the content
function generateQuestion(content, type, agency) {
  // Extract first sentence of content
  const firstSentence = content.split(/[.!?]/)[0] + '.';
  
  // Create agency-specific prefix
  const agencyPrefix = agency ? `${agency}: ` : '';
  
  // Create question patterns based on content type
  switch (type) {
    case 'training':
      if (content.toLowerCase().includes('astronaut training')) {
        return `${agencyPrefix}What does astronaut training involve?`;
      } else if (content.toLowerCase().includes('physical')) {
        return `${agencyPrefix}What physical requirements are needed for astronaut training?`;
      } else if (content.toLowerCase().includes('simulation')) {
        return `${agencyPrefix}How do simulators help train astronauts?`;
      }
      return `${agencyPrefix}What aspects of astronaut training are covered in this information?`;
      
    case 'missions':
      if (content.toLowerCase().includes('artemis')) {
        return `${agencyPrefix}What is the Artemis mission about?`;
      } else if (content.toLowerCase().includes('iss') || content.toLowerCase().includes('international space station')) {
        return `${agencyPrefix}What missions are conducted on the International Space Station?`;
      } else if (content.toLowerCase().includes('commercial crew')) {
        return `${agencyPrefix}What is the Commercial Crew Program?`;
      } else if (content.toLowerCase().includes('gaganyaan')) {
        return `${agencyPrefix}What is the Gaganyaan mission?`;
      } else if (content.toLowerCase().includes('tiangong')) {
        return `${agencyPrefix}What is the Tiangong space station program?`;
      }
      return `${agencyPrefix}What space missions are described in this information?`;
      
    case 'requirements':
      if (content.toLowerCase().includes('education')) {
        return `${agencyPrefix}What educational requirements are needed to become an astronaut?`;
      } else if (content.toLowerCase().includes('physical')) {
        return `${agencyPrefix}What are the physical requirements to become an astronaut?`;
      } else if (content.toLowerCase().includes('selection')) {
        return `${agencyPrefix}How are astronauts selected?`;
      }
      return `${agencyPrefix}What requirements must astronaut candidates meet?`;
      
    case 'career':
      return `${agencyPrefix}What career path leads to becoming an astronaut?`;
      
    case 'astronauts':
      if (content.toLowerCase().includes('training')) {
        return `${agencyPrefix}How are astronauts trained?`;
      } else if (content.toLowerCase().includes('selection')) {
        return `${agencyPrefix}How are astronauts selected?`;
      } else if (content.toLowerCase().includes('experience')) {
        return `${agencyPrefix}What experiences do astronauts have in space?`;
      }
      return `${agencyPrefix}What information is provided about astronauts?`;
      
    case 'science':
      if (content.toLowerCase().includes('microgravity')) {
        return `${agencyPrefix}How does microgravity affect the human body?`;
      } else if (content.toLowerCase().includes('radiation')) {
        return `${agencyPrefix}What radiation risks do astronauts face in space?`;
      } else if (content.toLowerCase().includes('research')) {
        return `${agencyPrefix}What research is being conducted on humans in space?`;
      }
      return `${agencyPrefix}What scientific aspects of human spaceflight are discussed here?`;
      
    default:
      // Default question generation based on content
      if (firstSentence.length > 10 && firstSentence.length < 100) {
        // Convert statement to question if possible
        return `${agencyPrefix}${firstSentence.replace(/\.$/, '?')}`;
      }
      return `${agencyPrefix}What information about space exploration is provided here?`;
  }
}

// Function to save content to the database
async function saveContent(content, source, sourceUrl, title, agency, contentType = 'knowledge') {
  try {
    // Skip very short content
    if (content.length < 100) {
      console.log(`Skipping short content (${content.length} chars)`);
      return false;
    }
    
    // Generate embedding for the content
    const embedding = await generateEmbedding(content);
    
    // Generate question for this content
    const question = generateQuestion(content, source, agency);
    
    // Create content document
    const contentDoc = new StellaKnowledge({
      // Add required question field
      question: question,
      content: content,
      embedding: embedding,
      category: 'space_knowledge',
      subcategory: source,
      contextTags: [source, 'factual', 'scraped', contentType, agency],
      contentType: contentType,
      source: sourceUrl,
      metadata: {
        dateScraped: new Date(),
        sourceType: source,
        sourceTitle: title,
        spaceAgency: agency
      }
    });
    
    await contentDoc.save();
    console.log(`✅ Saved content from ${agency} - ${title}: ${content.substring(0, 50)}...`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error saving content from ${sourceUrl}:`, error);
    return false;
  }
}

// Function to scrape a webpage
async function scrapePage(source) {
  try {
    console.log(`\n🔍 Scraping ${source.agency}: ${source.title} (${source.url})...`);
    
    // Configure axios with timeouts and headers
    const axiosConfig = {
      timeout: 15000, // 15 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Cache-Control': 'max-age=0'
      }
    };
    
    // Fetch the webpage
    const response = await axios.get(source.url, axiosConfig);
    const $ = cheerio.load(response.data);
    
    // Extract the page title if not provided
    const pageTitle = source.title || extractTitle($);
    
    // Extract paragraphs directly
    const paragraphs = extractParagraphs($);
    
    if (paragraphs.length > 0) {
      console.log(`📄 Found ${paragraphs.length} paragraphs to process`);
      
      // Process and save each paragraph
      let savedCount = 0;
      for (const paragraph of paragraphs) {
        const processedText = processText(paragraph);
        if (processedText.length > 100) {
          const saved = await saveContent(
            processedText, 
            source.type, 
            source.url, 
            pageTitle,
            source.agency,
            'knowledge'
          );
          if (saved) savedCount++;
        }
        
        // Brief pause to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`✅ Saved ${savedCount} content pieces from ${source.agency} - ${pageTitle}`);
    } else {
      // Fallback method: Extract all text and split into chunks
      console.log(`⚠️ No paragraphs found using selectors, falling back to text extraction`);
      
      let contentText = $('body').text();
      contentText = processText(contentText);
      
      // Split into manageable chunks
      const chunks = splitIntoParagraphs(contentText);
      console.log(`📄 Split content into ${chunks.length} chunks`);
      
      // Save each substantial chunk
      let savedCount = 0;
      for (const chunk of chunks) {
        if (chunk.length > 100) {
          const saved = await saveContent(
            chunk, 
            source.type, 
            source.url, 
            pageTitle,
            source.agency,
            'knowledge'
          );
          if (saved) savedCount++;
        }
        
        // Brief pause to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log(`✅ Saved ${savedCount} content chunks from ${source.agency} - ${pageTitle}`);
    }
    
    // Create a log entry about this scrape
    return {
      url: source.url,
      title: pageTitle,
      type: source.type,
      agency: source.agency,
      timestamp: new Date().toISOString(),
      status: 'success'
    };
    
  } catch (error) {
    console.error(`❌ Error scraping ${source.url}: ${error.message}`);
    
    // Return error log
    return {
      url: source.url,
      title: source.title,
      type: source.type,
      agency: source.agency,
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message
    };
  }
}

// Main function to scrape all sources
async function scrapeAllSources() {
  console.log('🚀 Starting global space agencies content scraping...');
  
  // Ensure logs directory exists
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Initialize log
  const scrapeLog = {
    id: uuidv4(),
    startTime: new Date().toISOString(),
    sources: [],
    summary: {
      total: sources.length,
      success: 0,
      failed: 0,
      byAgency: {}
    }
  };
  
  // Initialize agency counters
  const agencies = [...new Set(sources.map(source => source.agency))];
  agencies.forEach(agency => {
    scrapeLog.summary.byAgency[agency] = { total: 0, success: 0, failed: 0 };
  });
  
  // Count totals by agency
  sources.forEach(source => {
    scrapeLog.summary.byAgency[source.agency].total++;
  });
  
  // Process each source
  for (const source of sources) {
    const result = await scrapePage(source);
    
    // Update log
    scrapeLog.sources.push(result);
    if (result.status === 'success') {
      scrapeLog.summary.success++;
      scrapeLog.summary.byAgency[source.agency].success++;
    } else {
      scrapeLog.summary.failed++;
      scrapeLog.summary.byAgency[source.agency].failed++;
    }
    
    // Brief pause between sources to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Complete the log
  scrapeLog.endTime = new Date().toISOString();
  scrapeLog.duration = (new Date(scrapeLog.endTime) - new Date(scrapeLog.startTime)) / 1000; // duration in seconds
  
  // Save log to file
  const logFilePath = path.join(logsDir, `scrape-log-${new Date().toISOString().slice(0,10)}.json`);
  fs.writeFileSync(logFilePath, JSON.stringify(scrapeLog, null, 2));
  
  // Build agency summary string
  let agencySummary = '';
  agencies.forEach(agency => {
    const stats = scrapeLog.summary.byAgency[agency];
    agencySummary += `\n${agency}: ${stats.success}/${stats.total} successful`;
  });
  
  console.log(`
🏁 Global Space Agencies Content Scraping Complete
--------------------------------------------------
Total Sources: ${scrapeLog.summary.total}
Successfully Scraped: ${scrapeLog.summary.success}
Failed: ${scrapeLog.summary.failed}
Duration: ${scrapeLog.duration} seconds
${agencySummary}
Log saved to: ${logFilePath}
  `);
  
  mongoose.disconnect();
}

// Run the scraping script
scrapeAllSources().catch(error => {
  console.error('❌ Error in scraping script:', error);
  mongoose.disconnect();
  process.exit(1);
});