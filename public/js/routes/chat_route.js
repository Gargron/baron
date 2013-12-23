var ChatRoute = Ember.Route.extend({
  setupController: function (controller, model) {
    model.on('channel.opened', function () {
      controller.set('canChat', true);
    });

    model.on('channel.closed', function () {
      controller.set('canChat', false);
    });

    model.on('stream.added', function (stream) {
      controller.set('remoteStream', stream);
    });

    model.on('stream.removed', function () {
      controller.set('remoteStream', null);
    });

    controller.set('content', model);
  }
});

module.exports = ChatRoute;

