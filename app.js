var express = require('express'),
  http      = require('http'),
  path      = require('path'),
  app       = express(),
  server    = http.createServer(app),
  io        = require('socket.io').listen(server),
  request   = require('request');

var lists = {};

app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.cookieParser('abUjl=9773JJHm:J'));
  app.use(express.session());
  app.use(express.static(path.join(__dirname, 'public')));
});

app.get('/auth/current', function (req, res) {
  res.set('Content-Type', 'application/json');

  if (req.session.email) {
    res.send(JSON.stringify({
      email: req.session.email
    }));
  } else {
    res.send(401);
  }
});

app.post('/auth/login', function (req, res) {
  res.set('Content-Type', 'application/json');

  request.post({
    url: 'https://verifier.login.persona.org/verify',
    form: {
      'assertion': req.body.assertion,
      'audience': 'http://localhost:3000'
    }
  }, function (err, v_res, body) {
    if (err) {
      res.send(500);
      return;
    }

    var data = JSON.parse(body);

    if (data.status === 'okay') {
      req.session.email = data.email;
      res.send(200, JSON.stringify({ email: data.email }));
    } else {
      res.send(500);
    }
  });
});

app.post('/auth/logout', function (req, res) {
  res.set('Content-Type', 'application/json');
  req.session = null;
  res.send(201, null);
});

app.post('/list/add', function (req, res) {
  if (req.session.email && req.body.email) {
    var entry = lists[req.session.email];

    if (! (entry instanceof Array)) {
      entry = [];
    }

    entry.push(req.body.email);
    res.send(201, null);
  } else {
    res.send(400);
  }
});

app.get('/list/get', function (req, res) {
  // TODO
})

io.sockets.on('connection', function (connection) {
  // TODO
});

server.listen(3000);
