module.exports = {
    validateEmail: (email) => /\S+@\S+\.\S+/.test(email),
    validateUsername: (username) => username.length >= 3
};
