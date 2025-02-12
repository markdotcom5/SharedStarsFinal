const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'TeamRoles route is working!' });
});

module.exports = router;
