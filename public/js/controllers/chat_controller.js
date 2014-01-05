var ChatController = Ember.ObjectController.extend({
  needs: ['application', 'calls'],
  newMessage: null,
  remoteStream: null,

  hasMedia: function () {
    // We want to display the media view
    // when either the remote or the local stream exists and isn't fake
    return (this.get('remoteStream') != null && this.get('content.remoteMediaType') !== 'text')
    || (this.get('content.localStream') != null && this.get('content.localMediaType') !== 'text');
  }.property('remoteStream', 'content.localStream', 'content.localMediaType', 'content.remoteMediaType'),

  cannotChat: function () {
    return !this.get('content.hasChannel');
  }.property('content.hasChannel'),

  isReceivingCall: function () {
    var self = this;

    return this.get('controllers.calls.content').find(function (call) {
      return call.get('contact') == self.get('content');
    }) != null;
  }.property('controllers.calls.content.@each'),

  actions: {
    start: function (only_text, with_video) {
      var self = this;

      if (only_text) {
        this.set('content.localMediaType', 'text');
      } else if (with_video) {
        this.set('content.localMediaType', 'video');
      } else {
        this.set('content.localMediaType', 'audio');
      }

      App.getUserMedia(!only_text, with_video).then(function (stream) {
        self.get('content').setOutgoingStream(stream);
        self.get('content').prepareCall();
      });
    },

    drop: function () {
      this.get('content').dropCallOffer();
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

