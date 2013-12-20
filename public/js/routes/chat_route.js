var ChatRoute = Ember.Route.extend({
  setupController: function (controller, model) {
    controller.set('content', model);
    model.prepareChat();
    controller._bindChatEvents();
  }
});

module.exports = ChatRoute;

