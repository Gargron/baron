var CallsController = Ember.ArrayController.extend({
  actions: {
    accept: function (call, fake, with_video) {
      var self = this;

      if (fake) {
        call.set('contact.fake', true);
      }

      navigator.mozGetUserMedia({ audio: true, fake: fake, video: with_video }, function (stream) {
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

