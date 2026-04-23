const dbConnect = require('../utils/db');
const Link = require('../models/Link');
const { nanoid } = require('nanoid');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  await dbConnect();
  const { url, customSlug, category } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  
  try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }
  
  let slug = customSlug?.trim() || nanoid(6);
  let existing = await Link.findOne({ slug });
  let attempts = 0;
  while (existing && attempts < 5) {
    slug = nanoid(6);
    existing = await Link.findOne({ slug });
    attempts++;
  }
  if (existing) return res.status(409).json({ error: 'Slug unavailable' });
  
  const link = await Link.create({
    original_url: url,
    slug,
    category: category?.trim() || 'general'
  });
  
  res.json({ shortUrl: `${process.env.BASE_URL}/${slug}`, slug, originalUrl: url, category: link.category });
};
