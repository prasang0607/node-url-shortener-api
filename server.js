const express = require('express');
const { check, validationResult } = require('express-validator');
const logger = require('morgan');
const mongoose = require('mongoose');
const { DB_URI } = require('./config');
const ShortURL = require('./models/ShortURL');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(logger('dev'));
app.use(express.json());

mongoose
  .connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
  .then(result => {
    console.log('connected to database.');
    app.listen(PORT, () => console.log(`server listening on port ${PORT}...`));
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.send('hello world');
});

app.post(
  '/urls',
  [
    check('shortCode', 'Short code is required').not().isEmpty(),
    check('longUrl', 'Long URL is required').not().isEmpty(),
    check('shortCode', 'Short code should have atleast 2 chars').isLength({
      min: 2
    }),
    check('shortCode', 'Short code can have 20 chars at max').isLength({
      max: 20
    }),
    check('longUrl', 'Enter a valid URL').isURL({
      protocols: ['http', 'https']
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const msg = errors.array()[0].msg;
      return res.status(400).json({ error: msg, success: false });
    }

    const { shortCode, longUrl } = req.body;

    // check if record already exists with given short code
    let record = await ShortURL.findOne({ shortCode });
    if (record) {
      const msg = 'URL with provided code already exists';
      return res.status(400).json({ error: msg, success: false });
    }

    try {
      record = await ShortURL.create({ shortCode, longUrl });
      res.status(201).json({ record, success: true });
    } catch (err) {
      const msg = 'Something went wrong on server';
      res.status(400).json({ error: msg, success: false });
    }
  }
);

app.get('/urls', async (req, res) => {
  const records = await ShortURL.find({});
  res.json({ records, success: true });
});

app.get('/urls/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const record = await ShortURL.findById(id);
    return res.json({ record, success: true });
  } catch (err) {
    const msg = 'Something went wrong on server';
    return res.status(400).json({ error: msg, success: false });
  }
});

app.get('/:code', async (req, res) => {
  const { code } = req.params;

  try {
    const record = await ShortURL.findOne({ shortCode: code });
    if (!record) {
      const msg = 'URL with given short code not found';
      return res.status(400).json({ error: msg, success: false });
    }
    record.clicks += 1;
    await record.save();
    const { longUrl: redirectUrl } = record;
    if (redirectUrl.startsWith('http')) {
      return res.redirect(redirectUrl);
    } else {
      return res.redirect('//' + redirectUrl);
    }
  } catch (err) {
    const msg = 'Something went wrong on server';
    return res.status(400).json({ error: msg, success: false });
  }
});
