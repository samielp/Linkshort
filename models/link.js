const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, default: 'general' },
  clicks: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Link || mongoose.model('Link', LinkSchema);
