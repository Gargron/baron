var ApplicationController = Ember.Controller.extend({
  currentUser: null,
  connection: null,
  stream: null,

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

