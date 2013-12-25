var ContactsController = Ember.ArrayController.extend({
  needs: ['application', 'calls'],
  newContact: null,

  _contactFactory: function (raw) {
    var self = this,
      contact = App.Contact.create(raw);

    contact.set('signalingChannel', this.get('controllers.application.connection'));

    contact.on('connection.incoming', function (accept) {
      var request = Ember.Object.create({ contact: contact, accept: accept });
      self.get('controllers.calls.content').pushObject(request);
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

