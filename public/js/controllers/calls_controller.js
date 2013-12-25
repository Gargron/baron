var CallsController = Ember.ArrayController.extend({
  actions: {
    accept: function (call, only_text, with_video) {
      var self = this;

      if (only_text) {
        call.set('contact.localMediaType', 'text');
      } else if (with_video) {
        call.set('contact.localMediaType', 'video');
      } else {
        call.set('contact.localMediaType', 'audio');
      }

      navigator.mozGetUserMedia({ audio: true, fake: only_text, video: with_video }, function (stream) {
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

