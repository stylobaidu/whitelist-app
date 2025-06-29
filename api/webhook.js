export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).send('Webhook online. Use POST to send data.');
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Only POST allowed');
  }

  const { user, phone } = req.body;
  console.log('Webhook hit from:', user, 'with phone:', phone);
  res.status(200).json({ message: 'Received' });
}
