var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.createTable('contacts', {
    user_id: 'int',
    contact_user_id: 'int',
    type: 'string'
  }, callback);
};

exports.down = function(db, callback) {
  db.dropTable('contacts', callback);
};
