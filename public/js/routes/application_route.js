var ApplicationRoute = Ember.Route.extend({
  setupController: function (controller) {
    var self = this;

    App.getJSON('/auth/current').then(function (auth) {
      controller.set('currentUser', Ember.Object.create(auth));
      self._loadPersona();
      self._loadContacts();
      self._bindSignals();
    }, function (err) {
      self._loadPersona();
    });
  },

  _loadPersona: function () {
    var self = this;

    navigator.id.watch({
      loggedInUser: self.controller.get('currentUser.email'),

      onlogin: function (assertion) {
        App.postJSON('/auth/login', { assertion: assertion }).then(function (auth) {
          self.controller.set('currentUser', Ember.Object.create(auth));
          self._loadContacts();
          self._bindSignals();
        }, function (err) {
          navigator.id.logout();
        });
      },

      onlogout: function () {
        App.postJSON('/auth/logout').then(function (res) {
          self.controller.set('currentUser');
        }, null);
      }
    });
  },

  _loadContacts: function () {
    var self = this;

    this.controllerFor('contacts').set('content', []);

    App.getJSON('/list').then(function (list_wrapper) {
      // We have to handle two things here:
      // - Actual contacts list
      // - Contact requests

      list_wrapper.inbox.forEach(function (_requester) {
        self.controllerFor('requests').get('content').pushObject(_requester);
      });

      list_wrapper.list.forEach(function (_contact) {
        var contact = self.controllerFor('contacts')._contactFactory(_contact);
        self.controllerFor('contacts').get('content').pushObject(contact);
      });
    }, function (err) {
      // TODO
    });
  },

  _bindSignals: function () {
    if (this.controller.get('connection') != null) {
      this.controller.get('connection').close();
    }

    this.controller.set('connection', io.connect(BARON_SOCKET_ADDR));

    var connection = this.controller.get('connection'),
      self = this;

    connection.on('signal', function (signal) {
      var target = self.controllerFor('contacts').get('content').findBy('email', signal.from);

      console.log('Signal received', signal, target);

      if (typeof target === 'undefined') {
        return;
      }

      if (signal.type === 'ice') {
        target.addIceCandidate(signal.payload);
      } else if (signal.type === 'offer') {
        target.acceptCall(signal.payload, signal.media);
      } else if (signal.type === 'answer') {
        target.finalizeCall(signal.payload, signal.media);
      }
    });

    connection.on('update', function (update) {
      if (update.type === 'user') {
        var user = update.payload,
          target = self.controllerFor('contacts').get('content').findBy('email', user.email);

        if (typeof target === 'undefined') {
          return;
        }

        target.setProperties(user);
      } else if (update.type === 'list') {
        var contact = self.controllerFor('contacts')._contactFactory(update.payload);
        self.controllerFor('contacts').get('content').pushObject(contact);
      } else if (update.type === 'request') {
        self.controllerFor('requests').get('content').pushObject(update.payload);
      }
    });
  }
});

module.exports = ApplicationRoute;

