require('dotenv').load();

var request = require('request');
var express = require('express');
var _ = require('underscore');
var uuid = require('uuid');

var app = express();

var quotes = _.shuffle(require('./quotes.json'));

var port = process.env.PORT || 3000;

var memes;
var history = [];

var memeIndex = 0;
var quoteIndex = 0;
var historyIndex = 0;

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.set('view cache', false);

app.get('/', function (req, res) {
  res.redirect('/quote');
});

app.get('/quote', function (req, res, next) {
  generate(function (err, id) {
    if (err) {
      next(err);
    } else {
      res.redirect('/quote/' + id);
    }
  });
});

app.get('/quote/:id', function (req, res, next) {
  var data = _.findWhere(history, {
    id: req.params.id
  });
  if (data) {
    res.render('quote', data);
  } else {
    next(new Error('No quote with that ID'));
  }
});

loadPopularMemes(function () {
  app.listen(port, function () {
    console.log('Started server http://localhost:' + port);
  });
});

function generate(callback) {
  var quote = getRandomQuote();
  memeIndex = (memeIndex + 1) % memes.length;
  historyIndex = (historyIndex + 1) % 10;
  getImageWithCaption(memes[memeIndex], quote.top, quote.bottom, function (err, url) {
    if (err) {
      callback(err);
    } else {
      var id = uuid.v4();
      history[historyIndex] = {
        url: url,
        id: id
      };
      callback(null, id);
    }
  });
}

function getRandomQuote() {
  quoteIndex = (quoteIndex + 1) % quotes.length;
  var quote = quotes[quoteIndex].split('-');
  return {
    top: quote[0].trim(),
    bottom: quote[1].trim()
  };
}

function loadPopularMemes(callback) {
  request.get('https://api.imgflip.com/get_memes', function (err, res, body) {
    if (err) {
      callback(err);
    } else {
      memes = _.chain(JSON.parse(body).data.memes)
        .pluck('id')
        .shuffle()
        .value();
      callback(null);
    }
  });
}

function getImageWithCaption(id, textTop, textBottom, callback) {
  request.post('https://api.imgflip.com/caption_image', {
    form: {
      template_id: id,
      username: process.env.IMGFLIP_USER,
      password: process.env.IMGFLIP_PASS,
      text0: textTop,
      text1: textBottom
    }
  }, function (err, res, body) {
    if (err) {
      callback(err);
    } else {
      callback(null, JSON.parse(body).data.url);
    }
  });
}
