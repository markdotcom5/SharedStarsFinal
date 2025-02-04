const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect('mongodb+srv://<your-connection-string>', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB Atlas!');

    const user = await User.findOne({ name: 'mark' }); // Replace with a valid user
    if (user) {
        user.physicalChallenges.fitnessTestsCompleted = 2;
        user.spiritualChallenges.meditationsCompleted = 3;
        user.technicalChallenges.certificationsEarned = 1;
        await user.updateSpaceReadinessScore();
        console.log('Updated Space Readiness Score:', user.spaceReadinessScore);
    } else {
        console.log('User not found!');
    }

    mongoose.connection.close();
}).catch(err => {
    console.error('Error:', err);
});
