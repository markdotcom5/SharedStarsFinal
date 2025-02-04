const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust the path if necessary

const connectAndUpdate = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("✅ Connected to MongoDB.");

        // Your logic here (e.g., updating user marks)
        console.log("Performing user updates...");

        // Example logic: Updating a user's field
        const updatedUser = await User.findOneAndUpdate(
            { email: "testuser@example.com" }, // Example query
            { $set: { score: 100 } },          // Example update
            { new: true, runValidators: true }
        );

        console.log("✅ User updated:", updatedUser);

    } catch (err) {
        console.error("❌ Error during update process:", err.message);
    } finally {
        // Ensure the connection is closed after the script completes
        await mongoose.connection.close();
        console.log("✅ MongoDB connection closed.");
    }
};

// Run the script if executed directly
if (require.main === module) {
    connectAndUpdate();
}

// Export the function for reuse
module.exports = connectAndUpdate;
