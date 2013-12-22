var ApplicationRoute = Ember.Route.extend({
  setupController: function (controller) {
    var self = this;

    App.getJSON('/auth/current').then(function (auth) {
      controller.set('currentUser', auth.email);
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
      loggedInUser: self.controller.get('currentUser'),

      onlogin: function (assertion) {
        App.postJSON('/auth/login', { assertion: assertion }).then(function (res) {
          self.controller.set('currentUser', res.email);
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

    App.getJSON('/list').then(function (list) {
      list.forEach(function (_contact) {
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

    this.controller.set('connection', io.connect('http://' + window.location.host));

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
        target.acceptCall(signal.payload);
      } else if (signal.type === 'answer') {
        target.finalizeCall(signal.payload);
      }
    });
  }
});

module.exports = ApplicationRoute;

