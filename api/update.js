const dbConnect = require('../utils/db');
const Link = require('../models/Link');

module.exports = async (req, res) => {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  await dbConnect();
  const { slug, original_url, category } = req.body;
  if (!slug || !original_url) return res.status(400).json({ error: 'Slug and original_url required' });
  
  try { new URL(original_url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }
  
  const result = await Link.updateOne(
    { slug },
    { original_url, category: category || 'general', updated_at: new Date() }
  );
  if (result.matchedCount === 0) return res.status(404).json({ error: 'Link not found' });
  res.json({ success: true });
};
