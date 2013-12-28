var express      = require('express'),
  http           = require('http'),
  fs             = require('fs')
  path           = require('path'),
  app            = express(),
  server         = http.createServer(app),
  io             = require('socket.io').listen(server),
  request        = require('request'),
  parseCookie    = express.cookieParser(process.env.BARON_SECRET || 'some-dodgy-secret'),
  List           = require('./models/list'),
  ListRepository = require('./models/list_repository'),
  UserRepository = require('./models/user_repository'),
  lists          = new ListRepository(),
  users          = new UserRepository(),
  sessions       = new express.session.MemoryStore(),
  pg             = require('pg');

var notify_contacts, db_config, setupDB, PORT, AUDIENCE, SOCKET_AUDIENCE;

// Environmental variables:
// - BARON_SECRET - no default, cookie secret
// - BARON_PORT - 3000 by default, port under which NodeJS is run
// - BARON_AUDIENCE - Address of pub. accessible website
// - BARON_SOCKET_AUDIENCE - Address of pub. accessible socket.io instance, fallback to BARON_AUDIENCE
// - BARON_ENV - database environment, default dev

// TODO:
// - make users and lists permanent through a database

PORT            = process.env.BARON_PORT || 3000;
AUDIENCE        = process.env.BARON_AUDIENCE || ('http://localhost:' + PORT);
SOCKET_AUDIENCE = process.env.BARON_SOCKET_AUDIENCE || AUDIENCE;
ENV             = process.env.BARON_ENV || 'dev';

db_config = JSON.parse(fs.readFileSync('./database.json'));
db_config = db_config[ENV];

setupDB = function (req, res, next) {
  req.pg = new pg.Client('postgres://' + db_config.user + ':' + db_config.password + '@' + db_config.host + '/' + db_config.database);
  req.pg.connect(next);
};

app.configure(function () {
  app.use(express.bodyParser());
  app.use(parseCookie);
  app.use(express.session({ store: sessions }));
  app.use(express.static(path.join(__dirname, 'public')));

  // Provide a fresh database connection for each request
  app.use(setupDB);
});

app.get('/', function (req, res) {
  res.render('index.ejs', {
    locals: {
      baron_audience: AUDIENCE,
      baron_socket_audience: SOCKET_AUDIENCE
    }
  });
});

app.get('/auth/current', function (req, res) {
  res.set('Content-Type', 'application/json');

  if (req.session.email) {
    users.getByEmail(req.pg, req.session.email).then(function (user) {
      res.send(JSON.stringify(user));
    }).done();
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
      'audience': AUDIENCE
    }
  }, function (err, v_res, body) {
    if (err) {
      res.send(500, err);
      return;
    }

    var data = JSON.parse(body);

    if (data.status === 'okay') {
      users.create(req.pg, data.email).then(function (user) {
        req.session.regenerate(function () {
          req.session.email = data.email;
          res.send(JSON.stringify(user));
        });
      }, function (err) {
        console.error(err);
        res.send(500, 'A wild error appeared');
      }).done();
    } else {
      res.send(500, 'Mozilla Persona verification failed');
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
    users.getByEmail(req.pg, req.session.email).then(function (_user) {
      if (typeof _user === 'undefined') {
        throw new Error('Cannot find user');
      }

      user_a = _user;
      return users.getByEmail(req.pg, req.body.email);
    }).then(function (_user) {
      if (typeof _user === 'undefined') {
        throw new Error('Cannot find user');
      }

      user_b = _user;
      return lists.get(req.pg, user_a);
    }).then(function (_list) {
      entry_a = _list;
      return lists.get(req.pg, user_b);
    }).then(function (_list) {
      entry_b = _list;

      if (entry_b.hasInQueue(user_a)) {
        return lists.upgradeInvitation(req.pg, entry_a, user_b.email).then(function () {
          return lists.upgradeQueue(req.pg, entry_b, user_a.email);
        }).then(function () {
          // Notify users (if online) about new contact in lists
          io.sockets.in(user_a.email).emit('update', { type: 'list', payload: user_b });
          io.sockets.in(user_b.email).emit('update', { type: 'list', payload: user_a });
        });
      } else {
        return lists.addToQueue(req.pg, entry_a, user_b).then(function () {
          return lists.inviteToReciprocate(req.pg, entry_b, user_a);
        }).then(function () {
          // Notify the other user (if online) about contact request
          io.sockets.in(user_b.email).emit('update', { type: 'request', payload: user_a });
        });
      }
    }).then(function () {
      res.send(201, JSON.stringify(null));
    }).fail(function (err) {
      console.error(err);
      res.send(201, JSON.stringify(null));
    }).done();
  } else {
    res.send(400);
  }
});

app.get('/list', function (req, res) {
  res.set('Content-Type', 'application/json');

  if (req.session.email) {
    users.getByEmail(req.pg, req.session.email).then(function (user) {
      return lists.get(req.pg, user);
    }).then(function (list) {
      res.send(JSON.stringify(list));
    }).done();
  } else {
    res.send(401);
  }
});

app.post('/list/deny', function (req, res) {
  res.set('Content-Type', 'application/json');

  if (req.session.email && req.body.email) {
    users.getByEmail(req.pg, req.session.email).then(function (user) {
      return lists.get(req.pg, user);
    }).then(function (list) {
      return lists.removeInvitation(req.pg, list, req.body.email);
    }).then(function (list) {
      res.send(200, JSON.stringify(null));
    }).done();
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

notify_contacts = function (db, user) {
  lists.get(db, user).then(function (list) {
    var list_arr = list.asArray();

    if (list_arr.length > 0) {
      // Notify people on our user's contacts list about our user's updated attributes
      list_arr.forEach(function (contact) {
        io.sockets.in(contact.email).emit('update', { type: 'user', payload: user });
      });
    }
  });
};

io.sockets.on('connection', function (socket) {
  var req = {}, user;

  setupDB(req, {}, function (err) {
    users.getByEmail(req.pg, socket.handshake.email).then(function (_user) {
      return users.incrementOnlineCounter(req.pg, _user.id);
    }).then(function (_user) {
      user = _user;

      // ~join
      notify_contacts(req.pg, _user);
      socket.join(_user.email);
    }).done();
  });

  socket.on('signal', function (signal) {
    if (typeof user === 'undefined') {
      return;
    }

    setupDB(req, {}, function (err) {
      users.getByEmail(signal.to).then(function (to_user) {
        if (typeof to_user === 'undefined') {
          return;
        }

        signal.from = user.email;
        io.sockets.in(to_user.email).emit('signal', signal);
      }).done();
    });
  });

  socket.on('disconnect', function () {
    if (typeof user === 'undefined') {
      return;
    }

    setupDB(req, {}, function (err) {
      users.decrementOnlineCounter(req.pg, user.id).then(function (_user) {
        // ~leave
        notify_contacts(req.pg, _user);
      }).done();
    });
  });
});

server.listen(PORT);
