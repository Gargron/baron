var CallsController = Ember.ArrayController.extend({
  actions: {
    accept: function (call) {
      call.get('accept')();
      this.get('content').removeObject(call);
      this.transitionToRoute('chat', call.get('contact'));
    },

    deny: function (call) {
      this.get('content').removeObject(call);
    }
  }
});

module.exports = CallsController;

