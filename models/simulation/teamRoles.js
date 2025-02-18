const mongoose = require('mongoose');

const teamRoleSchema = new mongoose.Schema(
    {
        roleName: { type: String, required: true, unique: true },
        responsibilities: [{ type: String, required: true }], // List of role responsibilities
        requiredSkills: [{ type: String, required: true }], // Example: ["Navigation", "Mechanical Repair"]
    },
    { timestamps: true }
);

const TeamRole = mongoose.model('TeamRole', teamRoleSchema);
module.exports = TeamRole;
