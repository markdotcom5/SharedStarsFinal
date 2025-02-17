const express = require('express');
const router = express.Router();

// ✅ Example VR route
router.get('/status', (req, res) => {
    res.json({ message: "VR module is online!" });
});

module.exports = router;
