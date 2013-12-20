var express   = require('express'),
  http        = require('http'),
  path        = require('path'),
  app         = express(),
  server      = http.createServer(app),
  io          = require('socket.io').listen(server),
  request     = require('request'),
  parseCookie = express.cookieParser('abUjl=9773JJHm:J');

var lists  = {},
  users    = {},
  sessions = new express.session.MemoryStore();

app.configure(function () {
  app.use(express.bodyParser());
  app.use(parseCookie);
  app.use(express.session({ store: sessions }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.get('/auth/current', function (req, res) {
  res.set('Content-Type', 'application/json');

  if (req.session.email) {
    var user = users[req.session.email];
    res.send(JSON.stringify(user));
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
      var user = users[data.email] = {
        email: data.email,
        status: 'Not set',
        sid: null
      };

      req.session.regenerate(function () {
        req.session.email = data.email;
        res.send(JSON.stringify(user));
      });
    } else {
      res.send(500);
    }
  });
});

app.post('/auth/logout', function (req, res) {
  res.set('Content-Type', 'application/json');

  req.session.destroy(function () {
    res.send(201, null);
  });
});

app.post('/list', function (req, res) {
  res.set('Content-Type', 'application/json');

  if (req.session.email && req.body.email) {
    var entry = lists[req.session.email],
      user    = users[req.body.email];

    if (! (entry instanceof Array)) {
      entry = lists[req.session.email] = [];
    }

    if (typeof user === 'undefined') {
      res.send(404);
      return;
    }

    entry.push(user);
    res.send(JSON.stringify(user));
  } else {
    res.send(401);
  }
});

app.get('/list', function (req, res) {
  res.set('Content-Type', 'application/json');

  if (req.session.email) {
    var entry = lists[req.session.email];

    if (! (entry instanceof Array)) {
      entry = lists[req.session.email] = [];
    }

    res.send(JSON.stringify(entry));
  } else {
    res.send(401);
  }
});

io.configure(function () {
  io.set('authorization', function (handshakeData, callback) {
    if (handshakeData.headers.cookie) {
      var req = { headers: handshakeData.headers },
        res   = {};

      parseCookie(req, res, function () {
        sessions.get(req.signedCookies['connect.sid'], function (err, session) {
          if (err || !session || !session.email) {
            callback('Error loading session', false);
            return;
          }

          handshakeData.email = session.email;
          callback(null, true);
        });
      });
    } else {
      callback('Not authenticated', false);
    }
  });
});

io.sockets.on('connection', function (socket) {
  var user = users[socket.handshake.email];
  user.sid = socket.sid;

  socket.on('signal', function (signal) {
    var to_user = users[signal.to];

    if (typeof to_user === 'undefined' || to_user.sid === null) {
      return;
    }

    signal.from = user.email;
    io.sockets.socket(to_user.sid).emit('signal', signal);
  });

  socket.on('disconnect', function () {
    user.sid = null;
  });
});

server.listen(3000);
