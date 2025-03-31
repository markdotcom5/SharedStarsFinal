const express = require('express');
const router = express.Router();

router.post('/', express.raw({type: 'application/json'}), (req, res) => {
  res.status(200).send('Webhook received');
});

module.exports = router;