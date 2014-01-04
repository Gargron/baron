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

    navigator.getUserMedia({ audio: audio, video: video, fake: fake }, callback, function (err) {
      console.error(err);
    });
  },

  getAttention: function () {
    var sound = new Audio(App.soundsPaths['bloop']);
    sound.play();
  },

  getOverlyAttachedAttention: function () {
    var sound = new Audio(App.soundsPaths['bloop']);
    sound.loop = true;
    sound.play();

    return function () {
      sound.pause();
      sound = null;
    };
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

App.soundsPaths = {
  'bloop': '../../sounds/ping.wav'
};

module.exports = App;

