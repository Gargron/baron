var List = function (user) {
  this.user = user;
  this.list = [];
  this.has  = {};
};

List.prototype.add = function (user, authorized) {
  // Thanks to the `has` hash table we ensure
  // uniqueness of the list in O(1) time
  if (typeof this.has[user.email] === 'undefined') {
    this.list.push({
      authorized: authorized,
      user: user
    });

    this.has[user.email] = true;
  }
};

List.prototype.length = function () {
  return this.list.length;
};

List.prototype.forEach = function (callback) {
  return this.list.forEach(callback);
};

List.prototype.toJSON = function () {
  return JSON.stringify(this.list);
};

module.exports = List;
