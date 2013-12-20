var App = require('./app');

App.Router.map(function() {
  this.route('/');
  this.route('chat', { path: '/:email' });
});
