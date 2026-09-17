const router = require('express').Router();
const auth = require('../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware');
const User = require('../Backend Configuration/Models/UserSchema/user');
const Booking = require('../models/Booking');
router.use(auth);
router.get('/payment-settings', async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).select('role +paymentQr');
    if (!user) return res.sendStatus(404);
    res.json({ role: user.role, qr: user.paymentQr || '' });
  } catch { res.status(500).json({ message: 'Unable to load payment settings' }); }
});
router.put('/payment-settings', async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).select('role +paymentQr');
    if (user?.role !== 'mentor') return res.status(403).json({ message: 'Only mentors can set a payment QR' });
    const qr = req.body.qr;
    if (typeof qr !== 'string' || qr.length > 360000 || (qr && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(qr))) return res.status(400).json({ message: 'Upload a PNG, JPEG or WebP QR image, at most 250 KB.' });
    user.paymentQr = qr; await user.save(); res.json({ saved: true });
  } catch { res.status(500).json({ message: 'Unable to save QR' }); }
});
router.get('/mentors/:id/payment', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isActive: true }).select('name role hourlyRate +paymentQr');
    if (!user) return res.status(404).json({ message: 'User unavailable' });
    const isMentor = user.role === 'mentor';
    res.json({ name: user.name, amount: isMentor ? (user.hourlyRate || 0) : 0, qr: isMentor ? (user.paymentQr || '') : '', currency: 'INR' });
  } catch { res.status(400).json({ message: 'Unable to load payment details' }); }
});
router.put('/bookings/:id/payment/verify', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.sendStatus(404);
    if (String(booking.mentor) !== String(req.user._id || req.user.id)) return res.sendStatus(403);
    if (booking.paymentStatus !== 'pending_verification') return res.status(400).json({ message: 'No payment awaiting verification' });
    booking.paymentStatus = 'verified';
    await booking.save();

    // Credit mentor's wallet with session earnings (session rate minus 3% mentor fee)
    if (booking.paymentAmount > 0) {
      const Wallet = require('../models/Wallet');
      const WalletTransaction = require('../models/WalletTransaction');
      let mentorWallet = await Wallet.findOne({ user: booking.mentor });
      if (!mentorWallet) {
        mentorWallet = await Wallet.create({ user: booking.mentor, balance: 0, earnedBalance: 0, topupBalance: 0, currency: 'INR' });
      }
      if (mentorWallet.earnedBalance === undefined) mentorWallet.earnedBalance = 0;
      if (mentorWallet.topupBalance === undefined) mentorWallet.topupBalance = 0;

      const earnings = booking.mentorEarnings || (booking.paymentAmount - (booking.mentorPlatformFee || Math.round((booking.paymentAmount * 0.03 + Number.EPSILON) * 100) / 100));
      mentorWallet.earnedBalance = Math.round((mentorWallet.earnedBalance + earnings + Number.EPSILON) * 100) / 100;
      mentorWallet.balance = Math.round((mentorWallet.earnedBalance + mentorWallet.topupBalance + Number.EPSILON) * 100) / 100;
      await mentorWallet.save();

      await WalletTransaction.create({
        wallet: mentorWallet._id,
        user: booking.mentor,
        type: 'session_earning',
        amount: earnings,
        balanceAfter: mentorWallet.balance,
        booking: booking._id,
        mentorPlatformFee: booking.mentorPlatformFee || Math.round(booking.paymentAmount * 0.03),
        learnerConvenienceFee: booking.learnerConvenienceFee || 0,
        description: 'Session earnings from verified payment (3% platform fee deducted)',
        paymentMethod: 'qr',
        reference: booking.paymentReference
      });
    }

    res.json({ paymentStatus: 'verified' });
  } catch { res.status(500).json({ message: 'Unable to verify payment' }); }
});
module.exports = router;
