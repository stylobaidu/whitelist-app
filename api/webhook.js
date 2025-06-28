export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Only POST allowed');
  }

  const { user, phone } = req.body;

  // For now, just log it — later you can add DB or email logic
  console.log('Webhook hit from:', user, 'with phone:', phone);

  res.status(200).json({ message: 'Received' });
}
