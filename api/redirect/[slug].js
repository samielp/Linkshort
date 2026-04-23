const dbConnect = require('../../utils/db');
const Link = require('../../models/Link');

module.exports = async (req, res) => {
  const { slug } = req.query;
  await dbConnect();
  
  const link = await Link.findOne({ slug });
  if (!link) return res.status(404).send('Link not found');
  
  // Increment clicks asynchronously (don't await to speed redirect)
  Link.updateOne({ slug }, { $inc: { clicks: 1 }, updated_at: new Date() }).exec();
  
  res.redirect(link.original_url);
};
