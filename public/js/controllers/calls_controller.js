var CallsController = Ember.ArrayController.extend({
  actions: {
    accept: function (call) {
      var self = this;

      navigator.mozGetUserMedia({ audio: true, fake: true }, function (stream) {
        call.get('contact').setOutgoingStream(stream);
        call.get('accept')();
        self.get('content').removeObject(call);
        self.transitionToRoute('chat', call.get('contact'));
      }, function (err) {
        // TODO
      });
    },

    deny: function (call) {
      this.get('content').removeObject(call);
    }
  }
});

module.exports = CallsController;

