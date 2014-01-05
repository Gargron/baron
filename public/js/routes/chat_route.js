var ChatRoute = Ember.Route.extend({
  setupController: function (controller, model) {
    model.on('stream.added', function (stream) {
      controller.set('remoteStream', stream);
    });

    model.on('stream.removed', function () {
      controller.set('remoteStream', null);
    });

    if (model.get('isOnline') && !model.get('connected')) {
      // Automatically try to establish a text connection
      App.getUserMedia(false, false).then(function (stream) {
        model.set('localMediaType', 'text');
        model.setOutgoingStream(stream);
        model.prepareCall();
      });
    }

    controller.set('content', model);
  }
});

module.exports = ChatRoute;

