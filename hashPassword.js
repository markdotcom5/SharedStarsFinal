const bcrypt = require("bcrypt");

const password = "YourPasswordHere"; // Replace with your actual password

async function hashPassword() {
    const salt = await bcrypt.genSalt(10);  // Generate salt
    const hashedPassword = await bcrypt.hash(password, salt);  // Hash password
    console.log("Manually Hashed Password:", hashedPassword);
}

hashPassword();
