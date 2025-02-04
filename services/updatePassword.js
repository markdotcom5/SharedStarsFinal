const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path to your User model

(async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB');

        // Hash the new password
        const newPassword = 'new_password'; // Replace with your desired plaintext password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user in the database
        const email = 'mark@trihockey.com'; // Replace with the email of the user to update
        const result = await User.updateOne(
            { email },
            { password: hashedPassword }
        );

        console.log(`✅ Password updated for ${email}:`, result);
        mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error updating password:', error.message);
        mongoose.connection.close();
    }
})();
