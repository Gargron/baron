var ChatController = Ember.ObjectController.extend({
  needs: ['application', 'calls'],
  newMessage: null,
  canChat: false,
  remoteStream: null,

  hasMedia: function () {
    return this.get('remoteStream') != null;
  }.property('remoteStream'),

  cannotChat: function () {
    return !this.get('canChat');
  }.property('canChat'),

  isReceivingCall: function () {
    var self = this;

    return this.get('controllers.calls.content').find(function (call) {
      return call.get('contact') == self.get('content');
    }) != null;
  }.property('controllers.calls.content.@each'),

  actions: {
    start: function (fake, with_video) {
      var self = this;

      navigator.mozGetUserMedia({ audio: true, video: with_video, fake: fake }, function (stream) {
        self.get('content').setOutgoingStream(stream);
        self.get('content').prepareCall();
      }, function (err) {
        console.error(err);
      });
    },

    toggleVideo: function () {
      // TODO
    },

    toggleAudio: function () {
      // TODO
    },

    hangup: function () {
      this.get('content').closeCall();
    },

    sendMessage: function () {
      var message = App.Message.create({ from: this.get('controllers.application.currentUser'), text: this.get('newMessage'), timestamp: (new Date()).getTime() });
      this.get('content').pushMessage(this.get('newMessage'));
      this.get('content.messages').unshiftObject(message);
      this.set('newMessage', '');
    }
  }
});

module.exports = ChatController;

