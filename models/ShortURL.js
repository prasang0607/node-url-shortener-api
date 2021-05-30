const mongoose = require('mongoose');
const { isURL } = require('validator');

validateURLOptions = {
  protocols: ['http', 'https'],
  require_protocol: true
};

const ShortURLSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    longUrl: {
      type: String,
      required: true,
      trim: true,
      validate: url => isURL(url, validateURLOptions)
    },
    clicks: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const ShortURL = mongoose.model('urls', ShortURLSchema);
module.exports = ShortURL;
