module.exports = {
    email: {
        host: "smtp.gmail.com",  // Replace with your SMTP host
        port: 587,                 // Change if needed
        secure: false,             // Set to true if using SSL
        auth: {
            user: "tuser235142@gmail.com",   // Replace with actual email
            pass: "rbxy uiug fthw xijb"       // Replace with actual password
        },
        from: "tuser235142@gmail.com"  // Ensure `from` is defined
    },
    baseUrl: "http://localhost:3000" // Add base URL if missing
};
