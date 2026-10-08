const router = require('express').Router();
const auth = require('../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware');

router.use(auth);

// Compatibility route: Platform handles all payments centrally via Paytm Business
router.get('/payment-settings', async (req, res) => {
  res.json({
    role: req.user?.role || 'learner',
    platformPayment: true,
    message: 'Payments are centrally managed via platform Paytm Business UPI.'
  });
});

module.exports = router;
