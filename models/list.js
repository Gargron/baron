var hashToArray, List;

hashToArray = function (hash) {
  var arr = [], key;

  for (key in hash) {
    if (hash.hasOwnProperty(key)) {
      arr.push(hash[key]);
    }
  }

  return arr;
};

List = function (user) {
  this.user  = user;
  this.list  = {}; // Stores successful (two-way) contacts
  this.queue = {}; // Stores who user wants to add to contacts
  this.inbox = {}; // Stores invitations of reciprocation
};

List.prototype.hasInQueue = function (user) {
  return typeof this.queue[user.email] !== 'undefined';
};

List.prototype.asArray = function () {
  // O(n) - I'm so sorry
  return hashToArray(this.list);
};

List.prototype.toJSON = function () {
  // O(n) - I'm so sorry
  return { list: hashToArray(this.list), inbox: hashToArray(this.inbox) };
};

module.exports = List;
