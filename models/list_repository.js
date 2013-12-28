var q = require('q'),
  List = require('./list'),
  ListRepository, changeContactStatus, addContact;

changeContactStatus = function (db, list, email, from_status, to_status) {
  var deferred = q.defer(),
    user = list[from_status][email];

  if (typeof user === 'undefined') {
    return;
  }

  db.query('UPDATE contacts SET type = $1 WHERE user_id = $2 AND contact_user_id = $3 AND type = $4', [to_status, list.user.id, user.id, from_status], function (err, result) {
    if (err) {
      deferred.reject(err);
      return;
    }

    list[to_status][email] = list[from_status][email];
    delete list[from_status][email];

    deferred.resolve(list);
  });

  return deferred.promise;
};

addContact = function (db, list, user, status) {
  var deferred = q.defer();

  db.query("INSERT INTO contacts (user_id, contact_user_id, type) VALUES ($1, $2, $3)", [list.user.id, user.id, status], function (err, result) {
    if (err) {
      deferred.reject(err);
      return;
    }

    list[status][user.email] = user;
    deferred.resolve(list);
  });

  return deferred.promise;
}

ListRepository = function () {
  // Nothing to do here
};

ListRepository.prototype.get = function (db, user) {
  var deferred = q.defer();

  db.query('SELECT u.id, u.email, u.online, c.type FROM contacts AS c INNER JOIN users AS u ON u.id = c.contact_user_id WHERE c.user_id = $1', [user.id], function (err, result) {
    var list;

    if (err) {
      deferred.reject(err);
      return;
    }

    list = new List(user);

    result.rows.forEach(function (row) {
      list[row.type][row.email] = row;
    });

    deferred.resolve(list);
  });

  return deferred.promise;
};

ListRepository.prototype.removeInvitation = function (db, list, email) {
  var deferred = q.defer(),
    user = list.inbox[email];

  if (typeof user === 'undefined') {
    return;
  }

  db.query('DELETE FROM contacts WHERE user_id = $1 AND contact_user_id = $2 AND type = $3', [list.user.id, user.id, 'inbox'], function (err, result) {
    if (err) {
      deferred.reject(err);
      return;
    }

    delete list.inbox[email];
    deferred.resolve(list);
  });

  return deferred.promise;
};

ListRepository.prototype.upgradeInvitation = function (db, list, email) {
  return changeContactStatus(db, list, email, 'inbox', 'list');
};

ListRepository.prototype.upgradeQueue = function (db, list, email) {
  return changeContactStatus(db, list, email, 'queue', 'list');
};

ListRepository.prototype.addToQueue = function (db, list, user) {
  return addContact(db, list, user, 'queue');
};

ListRepository.prototype.inviteToReciprocate = function (db, list, user) {
  return addContact(db, list, user, 'inbox');
};

module.exports = ListRepository;
