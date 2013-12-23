var List = function (user) {
  this.user = user;
  this.list = [];
  this.has  = {};
};

List.prototype.add = function (user, authorized) {
  // Thanks to the `has` hash table we ensure
  // uniqueness of the list in O(1) time
  if (this.has[user.email]) {
    return;
  }

  this.list.push({
    'authorized': authorized,
    'user': user
  });

  this.has[user.email] = true;
};

List.prototype.asArray = function () {
  return this.list;
};

List.prototype.toJSON = List.prototype.asArray;

module.exports = List;
