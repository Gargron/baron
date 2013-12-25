var express      = require('express'),
  http           = require('http'),
  path           = require('path'),
  app            = express(),
  server         = http.createServer(app),
  io             = require('socket.io').listen(server),
  request        = require('request'),
  parseCookie    = express.cookieParser('some-dodgy-secret'),
  List           = require('./models/list'),
  ListRepository = require('./models/list_repository'),
  UserRepository = require('./models/user_repository'),
  lists          = new ListRepository(),
  users          = new UserRepository(),
  sessions       = new express.session.MemoryStore(),
  notify_contacts;

// TODO:
// - make users and lists permanent through a database

app.configure(function () {
  app.use(express.bodyParser());
  app.use(parseCookie);
  app.use(express.session({ store: sessions }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.get('/auth/current', function (req, res) {
  res.set('Content-Type', 'application/json');

  if (req.session.email) {
    var user = users.getByEmail(req.session.email);
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
      'audience': req.protocol + '://' + req.host + ':' + (process.env.BARON_PUBLIC_PORT || process.env.BARON_PORT || 3000)
    }
  }, function (err, v_res, body) {
    if (err) {
      res.send(500, err);
      return;
    }

    var data = JSON.parse(body);

    if (data.status === 'okay') {
      var user = users.create(data.email);

      req.session.regenerate(function () {
        req.session.email = data.email;
        res.send(JSON.stringify(user));
      });
    } else {
      res.send(500, 'Spoomf=3!');
    }
  });
});

app.post('/auth/logout', function (req, res) {
  res.set('Content-Type', 'application/json');

  req.session.destroy(function () {
    res.send(201, JSON.stringify(null));
  });
});

app.post('/list', function (req, res) {
  var user_a, user_b, entry_a, entry_b;

  res.set('Content-Type', 'application/json');

  if (req.session.email && req.body.email && req.session.email !== req.body.email) {
    user_a  = users.getByEmail(req.session.email);
    user_b  = users.getByEmail(req.body.email);

    if (typeof user_b === 'undefined') {
      res.send(201, JSON.stringify(null));
      return;
    }

    entry_a = lists.get(user_a);
    entry_b = lists.get(user_b);

    // Request approval from recipient
    if (entry_b.hasInQueue(user_a)) {
      entry_a.add(user_b);
      entry_b.add(user_a);

      // Notify users (if online) about new contact in lists
      if (user_a.sid != null) {
        io.sockets.socket(user_a.sid).emit('update', { type: 'list', payload: user_b });
      }

      if (user_b.sid != null) {
        io.sockets.socket(user_b.sid).emit('update', { type: 'list', payload: user_a });
      }
    } else {
      entry_a.addToQueue(user_b);
      entry_b.inviteToReciprocate(user_a);

      // Notify the other user (if online) about contact request
      if (user_b.sid != null) {
        io.sockets.socket(user_b.sid).emit('update', { type: 'request', payload: user_a });
      }
    }

    res.send(201, JSON.stringify(null));
  } else {
    res.send(400);
  }
});

app.get('/list', function (req, res) {
  res.set('Content-Type', 'application/json');

  if (req.session.email) {
    res.send(JSON.stringify(lists.get(users.getByEmail(req.session.email))));
  } else {
    res.send(401);
  }
});

app.post('/list/deny', function (req, res) {
  res.set('Content-Type', 'application/json');

  if (req.session.email && req.body.email) {
    lists.get(users.getByEmail(req.session.email)).removeInvitation(req.body.email);
    res.send(200, JSON.stringify(null));
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

notify_contacts = function (user) {
  var list_arr = lists.get(user).asArray();

  if (list_arr.length > 0) {
    // Notify people on our user's contacts list about our user's updated attributes
    list_arr.forEach(function (contact) {
      if (contact.sid != null) {
        io.sockets.socket(contact.sid).emit('update', { type: 'user', payload: user });
      }
    });
  }
};

io.sockets.on('connection', function (socket) {
  var user = users.getByEmail(socket.handshake.email);
  user.sid = socket.id;

  // ~join
  notify_contacts(user);

  socket.on('signal', function (signal) {
    var to_user = users.getByEmail(signal.to);

    if (typeof to_user === 'undefined' || to_user.sid === null) {
      return;
    }

    signal.from = user.email;
    io.sockets.socket(to_user.sid).emit('signal', signal);
  });

  socket.on('disconnect', function () {
    user.sid = null;
    // ~leave
    notify_contacts(user);
  });
});

server.listen(process.env.BARON_PORT || 3000);
