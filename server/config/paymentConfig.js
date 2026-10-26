/**
 * Platform Payment & Escrow Configuration
 * Platform fee settings, Razorpay escrow and refund rules
 */

module.exports = {
  // Platform fee percentage deducted from session price
  platformFeePercent: Number(process.env.PLATFORM_FEE_PERCENT) || 10,

  // Platform details
  getPlatformName: () => process.env.PLATFORM_NAME || "Skill Exchange",

  // Refund policies & rules
  refundRules: {
    mentor_no_show: {
      percent: 100,
      description: "Mentor did not attend the confirmed session (Full Refund)"
    },
    learner_cancel_advance: {
      percent: 100,
      description: "Learner cancelled more than 24 hours prior to session start"
    },
    learner_cancel_short_notice: {
      percent: 50,
      description: "Learner cancelled with less than 24 hours notice (50% Refund)"
    },
    admin_discretion: {
      percent: 100,
      description: "Discretionary refund approved by administrator"
    }
  }
};
