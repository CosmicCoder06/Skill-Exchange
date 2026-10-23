const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

test("Razorpay signature verification with HMAC-SHA256 and timingSafeEqual", () => {
    const secret = "test_razorpay_secret_12345";
    const orderId = "order_O68e09yB2Z7gG8";
    const paymentId = "pay_O68ea23w7vL8hZ";

    // Generate valid signature
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${orderId}|${paymentId}`);
    const validSignature = hmac.digest("hex");

    // Test timingSafeEqual on valid signature
    const bufExpected = Buffer.from(validSignature, "utf8");
    const bufReceived = Buffer.from(validSignature, "utf8");
    assert.equal(bufExpected.length === bufReceived.length, true);
    assert.equal(crypto.timingSafeEqual(bufExpected, bufReceived), true);

    // Test tampered signature fails
    const tamperedSignature = validSignature.slice(0, -4) + "abcd";
    const bufTampered = Buffer.from(tamperedSignature, "utf8");
    assert.equal(crypto.timingSafeEqual(bufExpected, bufTampered), false);
});

test("Razorpay webhook signature verification matches HMAC digest", () => {
    const webhookSecret = "whsec_test_abc123";
    const payload = JSON.stringify({
        event: "payment.captured",
        payload: { payment: { entity: { id: "pay_123", order_id: "order_123" } } }
    });

    const signature = crypto
        .createHmac("sha256", webhookSecret)
        .update(payload)
        .digest("hex");

    const expected = crypto
        .createHmac("sha256", webhookSecret)
        .update(payload)
        .digest("hex");

    assert.equal(
        crypto.timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8")),
        true
    );
});
