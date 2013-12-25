var Message = Ember.Object.extend({
  from: null,
  text: null,
  remote: false,
  timestamp: null,

  date: function () {
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

