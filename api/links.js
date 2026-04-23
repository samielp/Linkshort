const dbConnect = require('../utils/db');
const Link = require('../models/Link');

module.exports = async (req, res) => {
  await dbConnect();
  const { category } = req.query;
  const filter = category && category !== 'all' ? { category } : {};
  const links = await Link.find(filter).sort({ created_at: -1 });
  res.json(links);
};
