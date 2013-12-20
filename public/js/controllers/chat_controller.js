var ChatController = Ember.ObjectController.extend({
  needs: ['application'],
  messages: [],
  newMessage: null,

  _bindEvents: function () {
    var self = this
      contact = this.get('content');

    contact.on('channelMessageReceived', function (e) {
      self.get('messages').pushObject(e);
    });

    contact.on('connectionEstablished', function () {
      contact.prepareChat();
    });

    contact.on('streamAdded', function (stream) {
      contact.set('remoteStream', URL.createObjectURL(stream));
    });
  },

  localStream: function () {
    return URL.createObjectURL(this.get('controllers.application.stream'));
  }.property('controllers.application.stream'),

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

