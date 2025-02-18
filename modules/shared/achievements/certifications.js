const certifications = {
    physicalReadiness: {
        id: 'C100',
        name: 'Space Physical Readiness Certification',
        requirements: ['Complete all physical training tasks', 'Pass the endurance assessment'],
    },
    missionCommander: {
        id: 'C200',
        name: 'Mission Commander Certification',
        requirements: ['Lead a full mission simulation', 'Pass leadership evaluation'],
    },
    technicalSpecialist: {
        id: 'C300',
        name: 'Technical Systems Certification',
        requirements: [
            'Complete all technical systems training',
            'Achieve 90% on systems assessment',
        ],
    },
};

// ✅ Function to retrieve all certifications
function getCertifications() {
    return certifications;
}

// ✅ Export certifications
module.exports = { certifications, getCertifications };
