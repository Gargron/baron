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

      App.getUserMedia(!only_text, with_video).then(function (stream) {
        call.get('contact').setOutgoingStream(stream);
        call.get('accept')();
        self.get('content').removeObject(call);
        self.transitionToRoute('chat', call.get('contact'));
      });
    },

    deny: function (call) {
      call.get('deny')();
      call.get('contact').dropCallOffer();
      this.get('content').removeObject(call);
    }
  }
});

module.exports = CallsController;

