const crypto = require("crypto");
const Razorpay = require("razorpay");
const Booking = require("../models/Booking");
const { recordActivity } = require("../Utils/activityLogger");

function getRazorpayInstance() {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        throw new Error("Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured.");
    }

    return new Razorpay({
        key_id,
        key_secret
    });
}

/**
 * POST /api/payments/create-order
 * Validates booking belongs to logged-in learner, not already paid, not completed/cancelled.
 * Creates a Razorpay order in paise (INR).
 */
async function createOrder(req, res) {
    try {
        const userId = String(req.user?._id || req.user?.id);
        const { bookingId } = req.body;

        if (!bookingId) {
            return res.status(400).json({ message: "bookingId is required." });
        }

        const booking = await Booking.findById(bookingId).populate("mentor", "name email").populate("learner", "name email");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const bookingLearnerId = String(booking.learner?._id || booking.learner);
        if (bookingLearnerId !== userId) {
            return res.status(403).json({ message: "Unauthorized: only the booking learner can pay for this session." });
        }

        // Terminal session states cannot be paid
        if (["completed", "cancelled", "rejected"].includes(booking.status)) {
            return res.status(400).json({
                message: `Cannot process payment for a ${booking.status} session.`
            });
        }

        // Check if already paid
        const currentPaymentStatus = booking.payment?.status || booking.paymentStatus;
        if (["paid", "confirmed", "verified"].includes(currentPaymentStatus)) {
            return res.status(400).json({
                message: "This booking has already been paid and confirmed."
            });
        }

        // Amount calculation
        const sessionAmount = Number(
            booking.payment?.amount ||
            booking.baseSessionAmount ||
            booking.grossAmountWithGst ||
            booking.paymentAmount ||
            0
        );

        if (sessionAmount <= 0) {
            return res.status(400).json({
                message: "This is a free session and does not require payment."
            });
        }

        const amountInPaise = Math.round(sessionAmount * 100);

        const razorpay = getRazorpayInstance();

        // Razorpay receipt max 40 chars
        const receipt = String(booking._id).slice(-40);

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt,
            notes: {
                bookingId: String(booking._id),
                learnerId: userId,
                mentorId: String(booking.mentor?._id || booking.mentor)
            }
        });

        // Store razorpayOrderId on booking
        booking.razorpayOrderId = order.id;
        if (!booking.payment) booking.payment = {};
        booking.payment.razorpayOrderId = order.id;
        await booking.save();

        return res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
            booking: {
                id: booking._id,
                amount: sessionAmount,
                mentorName: booking.mentor?.name || "Mentor"
            }
        });
    } catch (error) {
        console.error("createOrder error:", error);
        return res.status(500).json({ message: error.message || "Failed to create Razorpay payment order." });
    }
}

/**
 * POST /api/payments/verify
 * Verifies HMAC SHA256 of order_id + "|" + payment_id with RAZORPAY_KEY_SECRET using timingSafeEqual.
 * On success sets paymentStatus = paid, status = accepted, stores IDs and paidAt.
 * On failure returns 400 and sets paymentStatus = failed.
 */
async function verifyPayment(req, res) {
    try {
        const userId = String(req.user?._id || req.user?.id);
        const {
            bookingId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                message: "Missing required payment verification parameters (bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature)."
            });
        }

        const booking = await Booking.findById(bookingId).populate("mentor", "name email").populate("learner", "name email");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const bookingLearnerId = String(booking.learner?._id || booking.learner);
        if (bookingLearnerId !== userId) {
            return res.status(403).json({ message: "Unauthorized: only the booking learner can verify payment." });
        }

        // Idempotency: if already paid, return success immediately
        const currentPaymentStatus = booking.payment?.status || booking.paymentStatus;
        if (["paid", "confirmed"].includes(currentPaymentStatus) && booking.razorpayPaymentId === razorpay_payment_id) {
            return res.json({
                success: true,
                message: "Payment already verified.",
                booking
            });
        }

        // Verify Signature
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            return res.status(500).json({ message: "Razorpay secret key is not configured on the server." });
        }

        const hmac = crypto.createHmac("sha256", keySecret);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generatedSignature = hmac.digest("hex");

        let isSignatureValid = false;
        try {
            const bufGenerated = Buffer.from(generatedSignature, "utf8");
            const bufReceived = Buffer.from(razorpay_signature, "utf8");
            if (bufGenerated.length === bufReceived.length) {
                isSignatureValid = crypto.timingSafeEqual(bufGenerated, bufReceived);
            }
        } catch {
            isSignatureValid = false;
        }

        if (!isSignatureValid) {
            // Update booking paymentStatus to failed
            booking.paymentStatus = "failed";
            if (!booking.payment) booking.payment = {};
            booking.payment.status = "failed";
            if (!booking.payment.logs) booking.payment.logs = [];
            booking.payment.logs.push({
                by: userId,
                from: currentPaymentStatus || "awaiting_payment",
                to: "failed",
                at: new Date(),
                note: `Payment verification failed. Invalid signature for payment ${razorpay_payment_id}`
            });
            await booking.save();

            return res.status(400).json({
                success: false,
                message: "Payment signature verification failed. Please try again or contact support."
            });
        }

        // Payment Success!
        const now = new Date();
        booking.paymentStatus = "paid";
        booking.status = "accepted"; // Booking confirmed upon payment!
        booking.paymentMethod = "razorpay";
        booking.razorpayOrderId = razorpay_order_id;
        booking.razorpayPaymentId = razorpay_payment_id;
        booking.razorpaySignature = razorpay_signature;
        booking.paidAt = now;
        booking.actionExpiresAt = null;
        booking.lastActionAt = now;

        if (!booking.payment) booking.payment = {};
        booking.payment.status = "paid";
        booking.payment.razorpayOrderId = razorpay_order_id;
        booking.payment.razorpayPaymentId = razorpay_payment_id;
        booking.payment.razorpaySignature = razorpay_signature;
        booking.payment.paidAt = now;
        if (!booking.payment.logs) booking.payment.logs = [];
        booking.payment.logs.push({
            by: userId,
            from: currentPaymentStatus || "awaiting_payment",
            to: "paid",
            at: now,
            note: `Payment auto-verified via Razorpay Checkout. Payment ID: ${razorpay_payment_id}`
        });

        await booking.save();

        recordActivity({
            actor: userId,
            action: "booking.paid",
            entityType: "Booking",
            entityId: booking._id,
            metadata: {
                paymentMethod: "razorpay",
                razorpayPaymentId: razorpay_payment_id,
                amount: booking.payment?.amount || booking.paymentAmount,
                reference: razorpay_payment_id
            }
        });

        const updatedBooking = await Booking.findById(booking._id)
            .populate("mentor learner", "name email role avatarUrl");

        return res.json({
            success: true,
            message: "Payment verified successfully! Your session is confirmed.",
            booking: updatedBooking
        });
    } catch (error) {
        console.error("verifyPayment error:", error);
        return res.status(500).json({ message: error.message || "Failed to verify Razorpay payment." });
    }
}

/**
 * POST /api/payments/webhook
 * Optional idempotent webhook handler for payment.captured.
 */
async function handleWebhook(req, res) {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            return res.status(500).json({ message: "RAZORPAY_WEBHOOK_SECRET is not configured." });
        }

        const signature = req.headers["x-razorpay-signature"];
        if (!signature) {
            return res.status(400).json({ message: "Missing x-razorpay-signature header." });
        }

        const rawBody = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(rawBody)
            .digest("hex");

        let isValid = false;
        try {
            const bufExpected = Buffer.from(expectedSignature, "utf8");
            const bufReceived = Buffer.from(signature, "utf8");
            if (bufExpected.length === bufReceived.length) {
                isValid = crypto.timingSafeEqual(bufExpected, bufReceived);
            }
        } catch {
            isValid = false;
        }

        if (!isValid) {
            return res.status(400).json({ message: "Invalid webhook signature." });
        }

        const event = req.body.event;
        if (event === "payment.captured") {
            const paymentEntity = req.body.payload?.payment?.entity;
            const orderId = paymentEntity?.order_id;
            const paymentId = paymentEntity?.id;
            const bookingId = paymentEntity?.notes?.bookingId;

            let booking = null;
            if (bookingId) {
                booking = await Booking.findById(bookingId);
            } else if (orderId) {
                booking = await Booking.findOne({
                    $or: [{ razorpayOrderId: orderId }, { "payment.razorpayOrderId": orderId }]
                });
            }

            if (booking) {
                const currentStatus = booking.payment?.status || booking.paymentStatus;
                // Idempotent: only update if not already paid
                if (currentStatus !== "paid" && currentStatus !== "confirmed") {
                    const now = new Date();
                    booking.paymentStatus = "paid";
                    booking.status = "accepted";
                    booking.paymentMethod = "razorpay";
                    booking.razorpayPaymentId = paymentId;
                    booking.paidAt = now;
                    booking.actionExpiresAt = null;
                    booking.lastActionAt = now;

                    if (!booking.payment) booking.payment = {};
                    booking.payment.status = "paid";
                    booking.payment.razorpayPaymentId = paymentId;
                    booking.payment.paidAt = now;
                    if (!booking.payment.logs) booking.payment.logs = [];
                    booking.payment.logs.push({
                        by: "razorpay_webhook",
                        from: currentStatus || "awaiting_payment",
                        to: "paid",
                        at: now,
                        note: `Payment captured via Razorpay webhook. Payment ID: ${paymentId}`
                    });

                    await booking.save();
                }
            }
        }

        return res.json({ status: "ok" });
    } catch (error) {
        console.error("handleWebhook error:", error);
        return res.status(500).json({ message: "Webhook processing error." });
    }
}

module.exports = {
    createOrder,
    verifyPayment,
    handleWebhook
};
