var ChatRoute = Ember.Route.extend({
  setupController: function (controller, model) {
    model.on('channel.opened', function () {
      controller.set('canChat', true);
    });

    model.on('channel.closed', function () {
      controller.set('canChat', false);
    });

    controller.set('content', model);
  }
});

module.exports = ChatRoute;

