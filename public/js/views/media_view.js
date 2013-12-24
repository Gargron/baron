var MediaView = Ember.View.extend({
  templateName: 'mediaview',
  classNames: ['media-view'],

  hasAnyVideo: function () {
    var videoTracks = 0;

    if (this.get('controller.remoteStream') != null) {
      videoTracks += this.get('controller.remoteStream').getVideoTracks().length;
    }

    if (this.get('controller.content.localStream') != null) {
      videoTracks += this.get('controller.content.localStream').getVideoTracks().length;
    }

    return videoTracks > 0;
  }.property('controller.remoteStream', 'controller.content.localStream'),

  remoteStreamSource: function () {
    if (this.get('controller.remoteStream') === null) {
      return;
    }

    return URL.createObjectURL(this.get('controller.remoteStream'));
  }.property('controller.remoteStream'),

  localStreamSource: function () {
    if (this.get('controller.content.localStream') === null) {
      return;
    }

    return URL.createObjectURL(this.get('controller.content.localStream'));
  }.property('controller.content.localStream')
});

module.exports = MediaView;

