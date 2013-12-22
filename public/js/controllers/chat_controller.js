var ChatController = Ember.ObjectController.extend({
  needs: ['application'],
  newMessage: null,

  actions: {
    start: function () {
      var self = this;

      navigator.mozGetUserMedia({ audio: true, fake: true }, function (stream) {
        self.get('content').setOutgoingStream(stream);
        self.get('content').prepareCall();
      }, function (err) {
        console.error(err);
      });
    },

    call: function (with_video) {
      // TODO
    },

    hangup: function () {
      this.get('content').closeCall();
    },

    sendMessage: function () {
      var message = App.Message.create({ from: this.get('controllers.application.currentUser'), text: this.get('newMessage')});
      this.get('content').pushMessage(this.get('newMessage'));
      this.get('content.messages').pushObject(message);
      this.set('newMessage', '');
    }
  }
});

module.exports = ChatController;

