var Contact = Ember.Object.extend(Ember.Evented, {
  email: null,
  status: null,
  peer: null,
  dataChannel: null,
  signallingChannel: null,
  remoteStream: null,

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
      console.log('Ice candidate generated', e);

      if (e.candidate) {
        self.get('signallingChannel').emit('signal', {
          to: self.get('email'),
          type: 'ice',
          payload: e.candidate
        });
      }
    };

    connection.onnegotiationneeded = function () {
      console.log('Negotiation needed');
      connection.createOffer(function (offer) {
        self._onCreateOffer(offer);
      }, self._handleFailure, {});
    };

    connection.ondatachannel = function (e) {
      console.log('Data channel available', e);
      self.set('dataChannel', e.channel);
      self._bindDataEvents();
    };

    connection.onaddstream = function (e) {
      self.trigger('streamAdded', e.stream);
    };

    connection.onremovestream = function () {
      self.trigger('streamRemoved');
    };

    this.set('peer', connection);
  },

  addIceCandidate: function (candidate) {
    this.get('peer').addIceCandidate(new mozRTCIceCandidate(candidate));
  },

  setOutgoingStream: function (stream) {
    console.log('Adding stream', stream);
    this.get('peer').addStream(stream);
  },

  prepareChat: function () {
    this.set('dataChannel', this.get('peer').createDataChannel('chat'));
    this._bindDataEvents();
  },

  pushMessage: function (msg) {
    if (this.get('dataChannel') === null) {
      return;
    }

    this.get('dataChannel').send(msg);
  },

  prepareCall: function () {
    var self = this,
      connection = this.get('peer');

    connection.createOffer(function (offer) {
      self._onCreateOffer(offer);
    }, this._handleFailure, {});
  },

  acceptCall: function (offer) {
    var self = this,
      connection = this.get('peer');

    connection.setRemoteDescription(new mozRTCSessionDescription(offer), function () {
      connection.createAnswer(function (answer) {
        connection.setLocalDescription(answer);

        self.get('signallingChannel').emit('signal', {
          to: self.get('email'),
          type: 'answer',
          payload: answer
        });
      }, self._handleFailure, {});
    }, this._handleFailure);
  },

  finalizeCall: function (answer) {
    var self = this;

    this.get('peer').setRemoteDescription(new mozRTCSessionDescription(answer), function () {
      self.trigger('connectionEstablished');
    });
  },

  _onCreateOffer: function (offer) {
    var self = this,
      connection = this.get('peer');

    console.log('Offer created', offer);

    connection.setLocalDescription(offer, function () {
      self.get('signallingChannel').emit('signal', {
        to: self.get('email'),
        type: 'offer',
        payload: offer
      });
    }, this._handleFailure);
  },

  _handleFailure: function (err) {
    console.error(err);
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

