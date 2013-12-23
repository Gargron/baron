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
        self.set('connected', true);
        self.trigger('connection.opened');
      } else if (connection.signalingState === 'closed') {
        console.log('Connection closed');
        self.set('connected', false);
        self.trigger('connection.closed');
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
  },

  _bindDataEvents: function (channel) {
    var self = this;

    channel.onopen = function () {
      console.log('Channel opened', channel);
      self.trigger('channel.opened');
    };

    channel.onmessage = function (e) {
      console.log('Message received', e);

      if (e.data instanceof Blob) {
        self.trigger('channel.file', e.data);
      } else {
        var message = App.Message.create({ from: self, text: e.data, remote: true });
        self.get('messages').pushObject(message);
        self.trigger('channel.message', message);
      }
    };

    channel.onclose = function () {
      console.log('Channel closed', channel);
      self.closeCall();
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
    this.get('dataChannel').send(msg);
  },

  prepareCall: function () {
    var self = this,
      connection = this.get('peer');

    var channel = connection.createDataChannel('chat');
    channel.binaryType = 'blob';

    this._bindDataEvents(channel);
    this.set('dataChannel', channel);

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
    this.set('connected', false);
    this.init();
    this.trigger('connection.closed');
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
  },

  remoteMessagesCount: function () {
    return this.get('messages').reduce(function (aggr, el) {
      if (el.get('remote')) {
        return aggr + 1;
      }

      return aggr;
    }, 0);
  }.property('messages.@each'),

  isOnline: function () {
    return this.get('sid') != null;
  }.property('sid')
});

module.exports = Contact;

