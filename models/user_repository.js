var q = require('q'),
  UserRepository, getByKey, updateExpressionByKey;

UserRepository = function () {
  // Whoop dee doop
};

getByKey = function (db, key, value) {
  var deferred = q.defer();

  db.query('SELECT id, email, online FROM users WHERE ' + key + ' = $1', [value], function (err, result) {
    if (err) {
      deferred.reject(err);
      return;
    }

    deferred.resolve(result.rows[0]);
  });

  return deferred.promise;
};

updateExpressionByKey = function (db, key, expression, by_key, by_value) {
  var self = this,
    deferred = q.defer();

  db.query('UPDATE users SET ' + key + ' = ' + expression + ' WHERE ' + by_key + ' = $1', [by_value], function (err, result) {
    if (err) {
      deferred.reject(err);
      return;
    }

    getByKey(db, by_key, by_value).then(function (user) {
      deferred.resolve(user);
    });
  });

  return deferred.promise;
};

UserRepository.prototype.get = function (db, id) {
  return getByKey(db, 'id', id);
};

UserRepository.prototype.getByEmail = function (db, email) {
  return getByKey(db, 'email', email);
};

UserRepository.prototype.create = function (db, email) {
  var self = this;

  return this.getByEmail(db, email).then(function (existing) {
    var user, deferred;

    deferred = q.defer();

    if (typeof existing !== 'undefined') {
      return existing;
    }

    db.query('INSERT INTO users (email, online) VALUES ($1, $2)', [email, 0], function (err, result) {
      if (err) {
        deferred.reject(err);
        return;
      }

      self.getByEmail(db, email).then(function (user) {
        deferred.resolve(user);
      });
    });

    return deferred.promise;
  });
};

UserRepository.prototype.incrementOnlineCounter = function (db, id) {
  return updateExpressionByKey(db, 'online', 'online + 1', 'id', id);
};

UserRepository.prototype.decrementOnlineCounter = function (db, id) {
  return updateExpressionByKey(db, 'online', 'online - 1', 'id', id);
};

module.exports = UserRepository;
