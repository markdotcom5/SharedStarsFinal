const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../../middleware/authenticate');
const { evaProcedures } = require('./data'); // Import EVA procedure data

// ✅ Function to get all EVA procedures
function getProcedures() {
    return evaProcedures;
}

// ✅ Route: Get all procedures
router.get('/', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            procedures: getProcedures(),
        });
    } catch (error) {
        console.error('❌ Error fetching EVA procedures:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch EVA procedures',
        });
    }
});

// ✅ Route: Get a specific procedure by ID
router.get('/:procedureId', authenticate, async (req, res) => {
    try {
        const procedureId = Number(req.params.procedureId); // Ensure ID is a number

        if (isNaN(procedureId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid procedure ID format',
            });
        }

        // ✅ Ensure `evaProcedures` is correctly formatted
        let procedure = null;
        if (Array.isArray(evaProcedures)) {
            procedure = evaProcedures.find((p) => p.id === procedureId);
        } else if (typeof evaProcedures === 'object') {
            procedure = Object.values(evaProcedures)
                .flat()
                .find((p) => p.id === procedureId);
        }

        if (!procedure) {
            return res.status(404).json({
                success: false,
                error: 'Procedure not found',
            });
        }

        res.json({
            success: true,
            procedure,
        });
    } catch (error) {
        console.error('❌ Error fetching EVA procedure:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch EVA procedure',
        });
    }
});

// ✅ Correctly export router and functions
module.exports = {
    router, // Express router for procedures
    getProcedures, // Allows importing `getProcedures()` separately
};
