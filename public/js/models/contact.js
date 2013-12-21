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
          //{ DtlsSrtpKeyAgreement: true },
          // { RtpDataChannels: true }
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

        connection.onicecandidate = null;
      }
    };

    connection.onconnection = function () {
      var channel;

      console.log('Connection established');

      channel = self.get('peer').createDataChannel('chat', { protocol: "text/plain", negotiated: true, id: 1 });
      channel.binaryType = 'blob';

      self._bindDataEvents(channel);
      self.set('dataChannel', channel);
    };

    connection.onclosedconnection = function () {
      console.log('Connection closed');
    };

    connection.ondatachannel = function (e) {
      console.log('Data channel received', e);
    };

    connection.onnegotiationneeded = function () {
      console.log('Negotiation needed');

      connection.createOffer(function (offer) {
        self._onCreateOffer(offer);
      }, self._handleFailure);
    };

    connection.onaddstream = function (e) {
      console.log('Stream received', e);
      self.trigger('stream.added', e.stream);
    };

    connection.onremovestream = function () {
      console.log('Stream removed');
      self.trigger('stream.removed');
    };

    this.set('peer', connection);
  },

  _bindDataEvents: function (channel) {
    channel.onopen = function () {
      self.trigger('channel.opened');
    };

    channel.onmessage = function (e) {
      self.trigger('channel.message', e);
      console.log(e);
    };

    channel.onclose = function () {
      self.trigger('channel.closed');
    };
  },

  addIceCandidate: function (candidate) {
    this.get('peer').addIceCandidate(new mozRTCIceCandidate(candidate));
  },

  setOutgoingStream: function (stream) {
    console.log('Adding stream', stream);
    this.get('peer').addStream(stream);
  },

  pushMessage: function (msg) {
    if (this.get('dataChannel') === null) {
      throw new Exception("No data channel established");
    }

    this.get('dataChannel').send(msg);
  },

  prepareCall: function () {
    var self = this,
      connection = this.get('peer');

    connection.createOffer(function (offer) {
      self._onCreateOffer(offer);
    }, this._handleFailure);
  },

  acceptCall: function (offer) {
    var self = this,
      connection = this.get('peer');

    connection.setRemoteDescription(new mozRTCSessionDescription(offer), function () {
      connection.createAnswer(function (answer) {
        connection.setLocalDescription(answer);

        console.log('Answer created', offer);
        self.trigger('connection.opened');

        self.get('signallingChannel').emit('signal', {
          to: self.get('email'),
          type: 'answer',
          payload: answer
        });
      }, self._handleFailure);
    }, this._handleFailure);
  },

  finalizeCall: function (answer) {
    var self = this;

    console.log('Answer received', answer);

    this.get('peer').setRemoteDescription(new mozRTCSessionDescription(answer), function () {
      self.trigger('connection.opened');
    }, this._handleFailure);
  },

  closeCall: function () {
    this.get('peer').close();
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
  }
});

module.exports = Contact;

