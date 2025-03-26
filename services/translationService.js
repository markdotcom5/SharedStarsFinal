const Translation = require('../models/Translation');

const getTranslationsByLanguage = async (language) => {
    return await Translation.find({ language });
};

const addTranslation = async (language, key, value) => {
    return await Translation.create({ language, key, value, updatedAt: new Date() });
};

const updateTranslation = async (language, key, value) => {
    return await Translation.findOneAndUpdate(
        { language, key },
        { value, updatedAt: new Date() },
        { new: true, upsert: true }
    );
};

module.exports = {
    getTranslationsByLanguage,
    addTranslation,
    updateTranslation
};
