var ChatController = Ember.ObjectController.extend({
  needs: ['application'],
  messages: [],
  newMessage: null,

  _bindEvents: function () {
    var self = this
      contact = this.get('content');

    contact.on('channel.message', function (e) {
      console.log(e);
    });
  },

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
      this.get('content').pushMessage(this.get('newMessage'));
      this.set('newMessage', '');
    }
  }
});

module.exports = ChatController;

