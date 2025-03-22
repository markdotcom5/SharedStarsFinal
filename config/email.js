require('dotenv').config();

module.exports = {
  email: {
    host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: process.env.EMAIL_PORT || 2525,
    secure: process.env.EMAIL_SECURE === 'true',  
    auth: {
      user: process.env.EMAIL_USER,    // Set in your .env file
      pass: process.env.EMAIL_PASS     // Set in your .env file
    },
    from: '"SharedStars Academy" <no-reply@sharedstars.com>'
  },
  adminEmail: process.env.ADMIN_EMAIL || 'mark@trihockey.com',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000'
};
