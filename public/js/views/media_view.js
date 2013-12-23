var MediaView = Ember.View.extend({
  templateName: 'mediaview',
  classNames: ['media-view'],

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

