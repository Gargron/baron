var ChatController = Ember.ObjectController.extend({
  needs: ['application'],
  messages: [],
  newMessage: null,

  _bindEvents: function () {
    var self = this
      contact = this.get('content');

    contact.on('channel.message', function (e) {
      self.get('messages').pushObject(e);
    });
  },

  actions: {
    start: function () {
      this.get('content').prepareCall();
    },

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

