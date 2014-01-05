var SoundManager = Ember.Object.extend({});

SoundManager.reopenClass({
  paths: {
    /**
     * Ping.wav
     * by hoobtastic
     * <http://www.freesound.org/people/hoobtastic/sounds/124357/>
     */
    'ping': '../../sounds/ping.wav',

    /**
     * BakelitePhoneRing.wav
     * by HerbertBoland
     * <http://www.freesound.org/people/HerbertBoland/sounds/29952/>
     */
    'ring': '../../sounds/ring.wav'
  },

  playOnce: function (id) {
    var self = this;

    return Ember.Deferred.promise(function (promise) {
      var audio = new Audio(self.paths[id]);

      audio.addEventListener('ended', function () {
        Ember.run(promise, promise.resolve);
      }, false);

      audio.play();
    });
  },

  playUntil: function (id) {
    var sound = new Audio(this.paths[id]);

    sound.loop = true;
    sound.play();

    return function () {
      sound.pause();
      sound = null;
    };
  }
});

module.exports = SoundManager;

