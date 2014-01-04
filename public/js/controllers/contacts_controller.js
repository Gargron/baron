var ContactsController = Ember.ArrayController.extend({
  needs: ['application', 'calls'],
  newContact: null,
  requests: [],

  _contactFactory: function (raw) {
    var self = this,
      contact = App.Contact.create(raw);

    contact.set('signalingChannel', this.get('controllers.application.connection'));

    contact.on('connection.incoming', function (accept) {
      var stopAttention, request;

      if (contact.get('waiting')) {
        // While we receive this offer, we have actually sent an offer before
        // We should reset our own offer, and just answer this one
        contact.get('peer').close();
        contact.init();
        accept(contact.get('peer')); // Overwriting connection object with the new one
        return;
      }

      stopAttention = App.getOverlyAttachedAttention();

      request = Ember.Object.create({
        contact: contact,
        accept: function () {
          stopAttention();
          accept();
        },
        deny: function () {
          stopAttention();
        }
      });

      self.get('controllers.calls.content').pushObject(request);
    });

    contact.on('connection.closed', function () {
      self.get('controllers.calls.content').removeObjects(self.get('controllers.calls.content').filter(function (request) {
        return request.get('contact') === contact;
      }));
    });

    return contact;
  },

  actions: {
    add: function () {
      var self = this;

      if (this.get('newContact') != null) {
        if (this.get('content').findBy('email', this.get('newContact'))) {
          return;
        }

        App.postJSON('/list', { email: this.get('newContact') }).then(function (res) {
          self.set('newContact', null);
        }, function (err) {
          // TODO
        });
      }
    }
  }
});

module.exports = ContactsController;

