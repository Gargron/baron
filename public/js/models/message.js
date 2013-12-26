var Message = Ember.Object.extend({
  from: null,
  text: null,
  remote: false,
  timestamp: null,
  read: false,

  date: function () {
    // This is accessed when message is rendered
    // Rendered only if the view/route is active
    // Therefore if it's rendered, the message was read
    this.set('read', true);

    return moment(this.get('timestamp'));
  }.property('timestamp'),

  dateTime: function () {
    return this.get('date').calendar();
  }.property('date'),

  dateFull: function () {
    return this.get('date').format("dddd, MMMM Do YYYY, h:mm:ss a");
  }.property('date')
});

module.exports = Message;

