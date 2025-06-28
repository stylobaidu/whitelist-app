const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE;

const client = require('twilio')(accountSid, authToken);

module.exports = async function sendSMS(req, res) {
  const { to, user } = req.query;
  try {
    await client.messages.create({
      body: `Number ${to} added to whitelist by ${user}`,
      from: twilioPhone,
      to,
    });
    res.status(200).send('SMS sent');
  } catch (error) {
    res.status(500).send('Error sending SMS');
  }
};