require('dotenv').config();

module.exports = {
  email: {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: process.env.EMAIL_USER || 'your-default-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-default-app-password'
    },
    from: process.env.EMAIL_FROM || 'your-default-email@gmail.com',
  },
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000'
};