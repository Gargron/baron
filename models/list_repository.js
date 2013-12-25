var List = require('./list'),
  ListRepository;

ListRepository = function () {
  this.lists = {};
};

ListRepository.prototype.get = function (user) {
  var list = this.lists[user.email];

  if (! (list instanceof List)) {
    this.lists[user.email] = new List(user);
    list = this.lists[user.email];
  }

  return list;
};

module.exports = ListRepository;
