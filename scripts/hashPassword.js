const bcrypt = require('bcrypt');

const hashPassword = async () => {
    try {
        const plainTextPassword = 'Sophia-715#'; // Updated password
        const hashedPassword = await bcrypt.hash(plainTextPassword, 10); // 10 salt rounds
        console.log('Hashed Password:', hashedPassword);
    } catch (error) {
        console.error('Error hashing password:', error.message);
    }
};

hashPassword();
