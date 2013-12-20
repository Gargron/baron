var ChatRoute = Ember.Route.extend({
  setupController: function (controller, model) {
    controller.set('content', model);
    model.prepareCall();
    controller._bindEvents();
  }
});

module.exports = ChatRoute;

