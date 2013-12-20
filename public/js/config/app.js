// require other, dependencies here, ie:
// require('./vendor/moment');

require('../vendor/jquery');
require('../vendor/handlebars');
require('../vendor/ember');
require('../vendor/bootstrap.min');

var App = Ember.Application.createWithMixins({
  getJSON: function (url) {
    return this.postJSON(url, {}, 'GET');
  },

  postJSON: function (url, data, method) {
    if (typeof method === 'undefined') {
      method = 'POST';
    }

    return Ember.Deferred.promise(function (promise) {
      $.ajax({
        type: method,
        url: url,
        data: data
      }).then(function (res) {
        Ember.run(promise, promise.resolve, res);
      }, function (err) {
        promise.reject(err);
      });
    });
  }
});

App.Router = Ember.Router.extend({
  location: 'none'
});

module.exports = App;

