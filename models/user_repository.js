var UserRepository = function () {
  this.users = {};
};

UserRepository.prototype.getByEmail = function (email) {
  return this.users[email];
};

UserRepository.prototype.create = function (email) {
  var existing, user;
  existing = this.getByEmail(email);

  if (typeof existing !== 'undefined') {
    return existing;
  }

  user = { email: email, status: 'Not set', online: 0 };
  this.users[email] = user;
  return user;
};

module.exports = UserRepository;
