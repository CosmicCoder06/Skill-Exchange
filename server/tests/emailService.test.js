const assert = require("node:assert/strict");
const test = require("node:test");

const { sendVerificationOtp } = require("../services/emailService");

test("sends an OTP through the Resend HTTPS API", async (t) => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;

  t.after(() => {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;
    if (originalFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = originalFrom;
  });

  process.env.RESEND_API_KEY = "re_test_key";
  process.env.EMAIL_FROM = "Skill Exchange <no-reply@example.com>";

  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      json: async () => ({ id: "email_test_id" }),
    };
  };

  const result = await sendVerificationOtp({
    name: "Akshat",
    otp: "123456",
    to: "member@example.com",
  });

  const body = JSON.parse(request.options.body);
  assert.equal(request.url, "https://api.resend.com/emails");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.Authorization, "Bearer re_test_key");
  assert.equal(body.from, process.env.EMAIL_FROM);
  assert.deepEqual(body.to, ["member@example.com"]);
  assert.match(body.subject, /123456/);
  assert.match(body.text, /123456/);
  assert.deepEqual(result, { id: "email_test_id" });
});
