var express      = require('express'),
  http           = require('http'),
  path           = require('path'),
  app            = express(),
  server         = http.createServer(app),
  io             = require('socket.io').listen(server),
  request        = require('request'),
  parseCookie    = express.cookieParser('some-dodgy-secret'),
  List           = require('./models/list'),
  ListOfLists    = require('./models/list_of_lists'),
  UserRepository = require('./models/user_repository');

// TODO:
// - make users and lists permanent through a database

var lists  = new ListOfLists(),
  users    = new UserRepository(),
  sessions = new express.session.MemoryStore();

var notify_contacts;

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
      'audience': 'http://' + req.host + ':3000' // FIXME: site URL
    }
  }, function (err, v_res, body) {
    if (err) {
      res.send(500);
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
  var me, user, entry_a, entry_b;

  res.set('Content-Type', 'application/json');

  if (req.session.email && req.body.email && req.session.email !== req.body.email) {
    me      = users.getByEmail(req.session.email);
    entry_a = lists.get(me);
    user    = users.getByEmail(req.body.email);

    if (typeof user === 'undefined') {
      res.send(404);
      return;
    }

    entry_b = lists.get(user);

    // Add users to each other's contacts lists
    // The other user did not authorize it yet, should
    // be shown a contact request with option to remove
    entry_a.add(user, true);
    entry_b.add(me, false);

    if (user.sid != null) {
      // Notify the other user (if online) about contact request
      io.sockets.socket(user.sid).emit('update', { type: 'list', payload: me });
    }

    res.send(JSON.stringify(user));
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
      if (contact.user.sid != null) {
        io.sockets.socket(contact.user.sid).emit('update', { type: 'user', payload: user });
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

server.listen(3000);
