var ChatRoute = Ember.Route.extend({
  setupController: function (controller, model) {
    controller.set('content', model);
  }
});

module.exports = ChatRoute;

