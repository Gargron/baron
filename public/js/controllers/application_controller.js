var ApplicationController = Ember.Controller.extend({
  currentUser: null,
  connection: null,

  init: function () {
    var connection = io.connect('http://localhost:3000');
    this.set('connection', connection);
  },

  initPersona: function () {
    var currentUser = this.get('currentUser'),
      self = this;

    navigator.id.watch({
      loggedInUser: currentUser,

      onlogin: function (assertion) {
        $.ajax({
          type: 'POST',
          url: '/auth/login',
          data: { assertion: assertion }
        }).then(function (res) {
          self.set('currentUser', res.email);
        }, function (err) {
          navigator.id.logout();
        });
      },

      onlogout: function () {
        console.log('onlogout', currentUser);

        $.ajax({
          type: 'POST',
          url: '/auth/logout'
        }).then(function (res) {
          self.set('currentUser', null);
        }, null);
      }
    });
  },

  actions: {
    login: function () {
      navigator.id.request();
    },

    logout: function () {
      navigator.id.logout();
    }
  }
});

module.exports = ApplicationController;

