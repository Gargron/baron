// require other, dependencies here, ie:
// require('./vendor/moment');

require('../vendor/jquery');
require('../vendor/handlebars');
require('../vendor/ember');
require('../vendor/bootstrap.min');

// Polyfilling RTC support between different browser vendors
if (typeof navigator.getUserMedia === 'undefined') {
  navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
}

if (typeof window.RTCPeerConnection === 'undefined') {
  window.RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
}

if (typeof window.RTCSessionDescription === 'undefined') {
  window.RTCSessionDescription = window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
}

if (typeof window.RTCIceCandidate === 'undefined') {
  window.RTCIceCandidate = window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
}

var App = Ember.Application.createWithMixins({
  hasFocus: true,

  getJSON: function (url) {
    return this.postJSON(url, {}, 'GET');
  },

  postJSON: function (url, data, method) {
    if (typeof method === 'undefined') {
      method = 'POST';
    }

    return Ember.Deferred.promise(function (promise) {
      $.ajax({
        type: method,
        url: url,
        data: data
      }).then(function (res) {
        Ember.run(promise, promise.resolve, res);
      }, function (err) {
        promise.reject(err);
      });
    });
  },

  getUserMedia: function (audio, video, callback) {
    var fake;

    if (!audio && !video) {
      fake = true;
    }

    return Ember.Deferred.promise(function (promise) {
      if (typeof navigator.mozGetUserMedia === 'undefined' && fake) {
        // Only Mozilla understands and needs the "fake" constraint
        // If this is not Mozilla, and we need a fake stream, just let
        // it return null
        Ember.run(promise, promise.resolve, null);
        return;
      }

      navigator.getUserMedia({
        audio: audio,
        video: video,
        fake: fake
      }, function (stream) {
        Ember.run(promise, promise.resolve, stream);
      }, function (err) {
        promise.reject(err);
      });
    });
  },

  getAttention: function () {
    return App.SoundManager.playOnce('ping');
  },

  getOverlyAttachedAttention: function () {
    return App.SoundManager.playUntil('ring');
  },

  ready: function () {
    var self = this;

    $(window).on('focus', function () {
      self.set('hasFocus', true);
    }).on('blur', function () {
      self.set('hasFocus', false);
    });
  }
});

App.Router = Ember.Router.extend({
  location: 'none'
});

module.exports = App;

