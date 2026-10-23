const router = require('express').Router();
const auth = require('../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware');
const {
    createOrder,
    verifyPayment,
    handleWebhook
} = require('../controllers/paymentController');

// Razorpay Webhook (verifies raw signature, no auth token header needed)
router.post('/payments/webhook', handleWebhook);

// Razorpay Protected Learner Checkout Routes
router.post('/payments/create-order', auth, createOrder);
router.post('/payments/verify', auth, verifyPayment);

// Compatibility route: Platform handles all payments centrally via Razorpay
router.get('/payment-settings', auth, async (req, res) => {
    res.json({
        role: req.user?.role || 'learner',
        platformPayment: true,
        message: 'Payments are centrally managed via Razorpay.'
    });
});

module.exports = router;
