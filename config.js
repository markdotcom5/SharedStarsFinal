module.exports = {
    email: {
        host: "smtp.example.com",  // Replace with your SMTP host
        port: 587,                 // Change if needed
        secure: false,             // Set to true if using SSL
        auth: {
            user: "your-email@example.com",   // Replace with actual email
            pass: "your-email-password"       // Replace with actual password
        },
        from: "your-email@example.com"  // Ensure `from` is defined
    },
    baseUrl: "https://sharedstars.com" // Add base URL if missing
};
