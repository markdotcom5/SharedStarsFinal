const mongoose = require('mongoose'); // Import mongoose
const User = require('../models/User'); // Import the User model
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing

mongoose.connect('mongodb+srv://<your_connection_string>', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB Atlas.');

    const email = 'testuser@example.com';
    const password = 'password123';

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists.');
        } else {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create a new user with minimal fields
            const newUser = new User({
                email,
                password: hashedPassword // Hashing the password
            });

            await newUser.save();
            console.log('Test user created successfully:', newUser);
        }
    } catch (err) {
        console.error('Error creating user:', err);
    } finally {
        mongoose.connection.close();
    }
}).catch(err => console.error('Database connection error:', err));
