const mongoose = require('mongoose');
const Subscription = require('./models/Subscription'); // Adjust the path as needed
require('dotenv').config();

const testSubscription = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Connected to MongoDB');

        // Create a new subscription
        console.log('🔄 Creating a new subscription...');
        const subscription = new Subscription({
            userId: new mongoose.Types.ObjectId(), // Fake user ID
            plan: 'individual', // Example plan
        });

        // Save the subscription
        await subscription.save();
        console.log('✅ Subscription created:', subscription);

        // Disconnect from MongoDB
        console.log('🔄 Disconnecting from MongoDB...');
        mongoose.connection.close();
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testSubscription();
