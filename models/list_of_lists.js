var List = require('./list');

var ListOfLists = function () {
  this.lists = {};
};

ListOfLists.prototype.get = function (user) {
  var list = this.lists[user.email];

  if (! (list instanceof List)) {
    this.lists[user.email] = new List(user);
    list = this.lists[user.email];
  }

  return list;
};

module.exports = ListOfLists;
