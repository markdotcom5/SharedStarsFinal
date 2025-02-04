require('dotenv').config();

// Detailed debugging
console.log('Current working directory:', process.cwd());
console.log('Full environment check:');
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('PORT:', process.env.PORT);
console.log('Is MONGO_URI undefined?', process.env.MONGO_URI === undefined);
console.log('MONGO_URI type:', typeof process.env.MONGO_URI);

const fs = require('fs');
try {
    const envContent = fs.readFileSync('.env', 'utf8');
    console.log('ENV file content:', envContent);
} catch (err) {
    console.log('Error reading .env file:', err);
}
// Then your MongoDB connection
const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error('MongoDB URI is undefined');
        }
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected Successfully');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

// Call the connect function
connectDB();
Also, check if you have multiple instances of require('dotenv').config() in your app.js. Make sure it's only called once, at the very top of the file.
Try running your app again with these changes and let me know what output you get. The fact that test-env.js shows the correct environment variables means we're very close to solving this!
Copy
Retry


Claude can make mistakes. Please double-check responses.




3.5 Sonnet

Choose style
Tip:

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Import routes
const { router: authRoutes } = require('./routes/auth');
const leaderboardRoutes = require('./routes/leaderboard');
const paymentRoutes = require('./routes/payment');

// Right after your imports, add this debug line
console.log("About to connect with URI:", process.env.MONGO_URI);

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/payment', paymentRoutes);

// Error handling middleware
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((err, req, res, next) => {
    console.error('Unexpected Error:', err.stack);
    res.status(500).json({ error: 'An unexpected error occurred.' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});