var ContactsController = Ember.ArrayController.extend({
  newContact: null,

  actions: {
    add: function () {
      var self = this;

      if (this.get('newContact') != null) {
        App.postJSON('/list', { email: this.get('newContact') }).then(function (res) {
          var newContact = App.Contact.create(res);
          newContact.set('signallingChannel', self.get('target.connection'));
          self.get('content').pushObject(newContact);
          self.set('newContact', null);
        }, function (err) {
          // TODO
        });
      }
    }
  }
});

module.exports = ContactsController;

