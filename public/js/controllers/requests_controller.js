var RequestsController = Ember.ArrayController.extend({
  needs: ['contacts'],

  actions: {
    accept: function (requester) {
      this.set('controllers.contacts.newContact', requester.email);
      this.get('controllers.contacts').send('add');
      this.get('content').removeObject(requester);
    },

    deny: function (requester) {
      this.get('content').removeObject(requester);
      App.postJSON('/list/deny', { email: requester.email });
    }
  }
});

module.exports = RequestsController;

