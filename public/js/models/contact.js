var Contact = Ember.Object.extend(Ember.Evented, {
  email: null,
  status: null,
  peer: null,
  dataChannel: null,
  signallingChannel: null,

  init: function () {
    var self = this,
      connection = new mozRTCPeerConnection({
        "iceServers": [
          { "url": "stun:stun.services.mozilla.com" },
          { "url": "stun:stun.l.google.com:19302" }
        ]
      }, {
        optional: [
          { DtlsSrtpKeyAgreement: true },
          { RtpDataChannels: true }
        ]
      });

    connection.onicecandidate = function (e) {
      if (e.candidate) {
        console.log('Ice candidate found');

        self.get('signallingChannel').emit('signal', {
          to: self.get('email'),
          type: 'ice',
          payload: e.candidate.candidate
        });
      }
    };

    connection.onnegotiationneeded = function () {
      console.log('Negotiation needed');
      connection.createOffer(self._onCreateOffer, null, {});
    };

    connection.ondatachannel = function (e) {
      self.set('dataChannel', e.channel);
      self._bindDataEvents();
    };

    connection.onaddstream = function (stream) {
      self.trigger('streamAdded', stream);
    };

    connection.onremovestream = function () {
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

  prepareChat: function () {
    this.set('dataChannel', this.get('peer').createDataChannel('chat'));
    this._bindDataEvents();
  },

  pushMessage: function (msg) {
    this.get('dataChannel').send(msg);
  },

  prepareCall: function () {
    var connection = this.get('peer');
    connection.createOffer(this._onCreateOffer, null, {});
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
  },

  _onCreateOffer: function (offer) {
    connection.setLocalDescription(offer);
    self.get('signallingChannel').emit('signal', {
      to: self.get('email'),
      type: 'offer',
      payload: offer
    });
  },

  _bindDataEvents: function () {
    var self = this;

    this.get('dataChannel').onopen = function () {
      self.trigger('channelOpened');
    };

    this.get('dataChannel').onmessage = function (e) {
      self.trigger('channelMessageReceived', e);
    };
  }
});

module.exports = Contact;

