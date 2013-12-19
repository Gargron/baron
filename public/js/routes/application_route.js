var ApplicationRoute = Ember.Route.extend({
  setupController: function (controller) {
    var self = this;

    $.getJSON('/auth/current').then(function (res) {
      self.controller.set('currentUser', res.email);
      self.controller.initPersona();
    }, function (err) {
      self.controller.initPersona();
    });
  }
});

module.exports = ApplicationRoute;

