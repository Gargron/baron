var ContactsController = Ember.ArrayController.extend({
  needs: ['application'],
  newContact: null,

  actions: {
    add: function () {
      var self = this;

      if (this.get('newContact') != null) {
        App.postJSON('/list', { email: this.get('newContact') }).then(function (res) {
          var newContact = App.Contact.create(res);
          self.set('newContact', null);
          newContact.set('signallingChannel', self.get('controllers.application.connection'));

          if (self.get('controllers.application.stream') != null) {
            newContact.setOutgoingStream(self.get('controllers.application.stream'));
          }

          self.get('content').pushObject(newContact);
        }, function (err) {
          // TODO
        });
      }
    }
  }
});

module.exports = ContactsController;

