const dbConnect = require('../utils/db');
const Link = require('../models/Link');

module.exports = async (req, res) => {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  await dbConnect();
  const { slug } = req.body;
  if (!slug) return res.status(400).json({ error: 'Slug required' });
  
  const result = await Link.deleteOne({ slug });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Link not found' });
  res.json({ success: true });
};
