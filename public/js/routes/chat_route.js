var ChatRoute = Ember.Route.extend({
  setupController: function (controller, model) {
    controller.set('content', model);
    controller._bindEvents();
  }
});

module.exports = ChatRoute;

