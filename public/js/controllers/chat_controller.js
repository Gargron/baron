var ChatController = Ember.ObjectController.extend({
  messages: [],
  newMessage: null,

  _bindChatEvents: function () {
    var self = this
      contact = this.get('content');

    contact.on('channelMessageReceived', function (e) {
      self.get('messages').pushObject(e);
    });
  },

  actions: {
    call: function (with_video) {
      // TODO
    },

    hangup: function () {
      // TODO
    },

    sendMessage: function () {
      this.get('content').pushMessage(this.get('newMessage'));
      this.set('newMessage', '');
    }
  }
});

module.exports = ChatController;

