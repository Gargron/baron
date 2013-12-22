var Contact = Ember.Object.extend(Ember.Evented, {
  email: null,
  status: null,
  peer: null,
  dataChannel: null,
  signalingChannel: null,
  connected: false,
  messages: [],

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

    var channel = connection.createDataChannel('chat');
    channel.binaryType = 'blob';

    connection.onicecandidate = function (e) {
      console.log('Ice candidate generated', e);

      if (e.candidate) {
        self.get('signalingChannel').emit('signal', {
          to: self.get('email'),
          type: 'ice',
          payload: e.candidate
        });

        connection.onicecandidate = null;
      }
    };

    connection.onsignalingstatechange = function () {
      console.log('State change', connection.signalingState);

      if (connection.signalingState === 'stable') {
        console.log('Connection established');
        self.trigger('connection.opened');
        self.set('connected', true);
      } else if (connection.signalingState === 'closed') {
        console.log('Connection closed');
        self.trigger('connection.closed');
        self.set('connected', false);
      }
    };

    connection.ondatachannel = function (e) {
      console.log('Data channel received', e);

      var new_channel = e.channel;
      new_channel.binaryType = 'blob';
      self._bindDataEvents(new_channel);
      self.set('dataChannel', new_channel);
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
    this._bindDataEvents(channel);
    this.set('dataChannel', channel);
  },

  _bindDataEvents: function (channel) {
    var self = this;

    channel.onopen = function () {
      self.trigger('channel.opened');
    };

    channel.onmessage = function (e) {
      if (e.data instanceof Blob) {
        self.trigger('channel.file', e.data);
      } else {
        var message = App.Message.create({ from: self, text: e.data });
        self.get('messages').pushObject(message);
        self.trigger('channel.message', message);
      }
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

    this.trigger('connection.incoming', function () {
      connection.setRemoteDescription(new mozRTCSessionDescription(offer), function () {
        connection.createAnswer(function (answer) {
          connection.setLocalDescription(answer, function () {
            console.log('Answer created', offer);

            self.get('signalingChannel').emit('signal', {
              to: self.get('email'),
              type: 'answer',
              payload: answer
            });
          }, self._handleFailure);
        }, self._handleFailure);
      }, self._handleFailure);
    });
  },

  finalizeCall: function (answer) {
    var self = this;
    console.log('Answer received', answer);
    this.get('peer').setRemoteDescription(new mozRTCSessionDescription(answer), function () {}, this._handleFailure);
  },

  closeCall: function () {
    this.get('peer').close();
  },

  _onCreateOffer: function (offer) {
    var self = this,
      connection = this.get('peer');

    console.log('Offer created', offer);

    connection.setLocalDescription(offer, function () {
      self.get('signalingChannel').emit('signal', {
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

