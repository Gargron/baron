var Contact = Ember.Object.extend(Ember.Evented, {
  email: null,
  status: null,
  peer: null,
  signallingChannel: null,

  init: function () {
    var self = this,
      connection = new mozRTCPeerConnection({ "iceServers": [ { "url": "stun:stun.services.mozilla.com" } ] });

    connection.onicecandidate = function (e) {
      if (e.candidate) {
        self.get('signallingChannel').emit('signal', {
          to: self.get('email'),
          type: 'ice',
          payload: e.candidate.candidate
        });
      }
    };

    connection.onaddstream = function (stream) {
      self.trigger('streamAdded', stream);
    };

    connection.onremovestream = function (stream) {
      self.trigger('streamRemoved');
    };

    this.set('peer', connection);
  },

  addIceCandidate: function (candidate) {
    this.get('peer').addIceCandidate(new mozRTCIceCandidate({ candidate: candidate }));
  },

  setOutgoingStream: function (stream) {
    this.get('peer').addStream(stream);
  },

  prepareCall: function () {
    var connection = this.get('peer');

    connection.createOffer(function (offer) {
      connection.setLocalDescription(offer);
      self.get('signallingChannel').emit('signal', {
        to: self.get('email'),
        type: 'offer',
        payload: offer
      });
    }, null, {});
  },

  acceptCall: function (offer) {
    var connection = this.get('peer');

    connection.setRemoteDescription(new mozRTCSessionDescription(offer));

    connection.createAnswer(function (answer) {
      connection.setLocalDescription(answer);
      self.get('signallingChannel').emit('signal', {
        to: self.get('email'),
        type: 'answer',
        payload: answer
      });
    }, null, {});
  },

  finalizeCall: function (answer) {
    this.get('peer').setRemoteDescription(new mozRTCSessionDescription(answer));
  }
});

module.exports = Contact;

