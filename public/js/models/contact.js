var Contact = Ember.Object.extend(Ember.Evented, {
  email: null,
  status: null,
  peer: null,
  dataChannel: null,
  signalingChannel: null,
  localStream: null,
  localMediaType: 'text',
  remoteMediaType: 'text',
  connected: false,
  waiting: false,
  messages: [],

  constraints: {
    mandatory: {
      OfferToReceiveAudio: true,
      OfferToReceiveAudio: true
    }
  },

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
        self.set('waiting', false);
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
        var message = App.Message.create({ from: self, text: e.data, remote: true, timestamp: Math.floor(e.timeStamp / 1000) });
        self.get('messages').unshiftObject(message);
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
    this.set('localStream', stream);
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
    }, this._handleFailure, self.constraints);
  },

  acceptCall: function (offer, remoteMediaType) {
    var self = this,
      connection = this.get('peer');

    this.set('remoteMediaType', remoteMediaType);

    this.trigger('connection.incoming', function () {
      connection.setRemoteDescription(new mozRTCSessionDescription(offer), function () {
        connection.createAnswer(function (answer) {
          connection.setLocalDescription(answer, function () {
            console.log('Answer created', offer);

            self.get('signalingChannel').emit('signal', {
              to: self.get('email'),
              type: 'answer',
              media: self.get('localMediaType'),
              payload: answer
            });
          }, self._handleFailure);
        }, self._handleFailure, self.constraints);
      }, self._handleFailure);
    });
  },

  finalizeCall: function (answer, remoteMediaType) {
    var self = this;
    console.log('Answer received', answer);
    this.set('remoteMediaType', remoteMediaType);
    this.get('peer').setRemoteDescription(new mozRTCSessionDescription(answer), function () {}, this._handleFailure);
  },

  closeCall: function () {
    this.get('peer').close();
    this.set('waiting', false);
    this.set('connected', false);
    this.set('localStream', null);
    this.init();
    this.trigger('stream.removed');
    this.trigger('connection.closed');
  },

  _onCreateOffer: function (offer) {
    var self = this,
      connection = this.get('peer');

    console.log('Offer created', offer);
    self.set('waiting', true);

    connection.setLocalDescription(offer, function () {
      self.get('signalingChannel').emit('signal', {
        to: self.get('email'),
        type: 'offer',
        media: self.get('localMediaType'),
        payload: offer
      });
    }, this._handleFailure);
  },

  _handleFailure: function (err) {
    console.error(err);
  },

  remoteUnreadMessagesCount: function () {
    return this.get('messages').reduce(function (aggr, el) {
      if (el.get('remote') && !el.get('read')) {
        return aggr + 1;
      }

      return aggr;
    }, 0);
  }.property('messages.@each'),

  isOnline: function () {
    return this.get('sid') != null;
  }.property('sid'),

  _handleOnlineState: function () {
    if (this.get('sid') === null && this.get('waiting')) {
      this.closeCall();
    }
  }.observes('sid')
});

module.exports = Contact;

