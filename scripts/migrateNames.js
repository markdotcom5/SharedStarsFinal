/**
 * scripts/migrateNames.js
 * Script to migrate and normalize name fields in the SharedStars application database
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Application = require('../models/Application');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for migration'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function migrateNames() {
  console.log('Starting name field migration...');
  
  try {
    // Find all applications
    const applications = await Application.find({});
    console.log(`Found ${applications.length} applications to migrate`);
    
    let migratedCount = 0;
    
    for (const app of applications) {
      try {
        // Check if application has missing name fields
        if (!app.firstName && !app.lastName) {
          console.log(`Processing application ${app._id} with email: ${app.email}`);
          
          // Try to extract name from email if available
          if (app.email) {
            // Get the part before @ symbol
            const emailName = app.email.split('@')[0];
            
            // Convert email name to a proper name format (split by dots, underscores, etc.)
            const nameParts = emailName.split(/[._-]/);
            
            if (nameParts.length >= 2) {
              // Capitalize first letters
              app.firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
              app.lastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
              console.log(`Extracted name from email: ${app.firstName} ${app.lastName}`);
            } else {
              // Just use the email username
              app.firstName = emailName;
              app.lastName = "(From Email)";
              console.log(`Using email as name: ${app.firstName}`);
            }
          } else {
            console.log(`Application ${app._id} has no email, using placeholder name`);
            
            // Set placeholder name as fallback
            app.firstName = "Applicant";
            app.lastName = app._id.toString().slice(-5); // Last 5 chars of ID
          }
          
          // Add required fields if missing
          if (!app.lifeMissionAlignment) {
            app.lifeMissionAlignment = "Added during migration - needs update";
          }
          
          if (!app.spaceMissionChoice) {
            app.spaceMissionChoice = "Any";
          }
          
          // Save with validation disabled to bypass required field checks if needed
          await app.save();
          migratedCount++;
        } else {
          console.log(`Application ${app._id} already has name fields, skipping`);
        }
      } catch (appError) {
        console.error(`Error processing application ${app._id}:`, appError.message);
      }
    }
    
    console.log(`Migration complete. Migrated ${migratedCount} of ${applications.length} applications.`);
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Run the migration
migrateNames();