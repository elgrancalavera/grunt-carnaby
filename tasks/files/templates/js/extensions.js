  var Backbone = require('backbone');
  require('backbone.marionette');
  exports = new Backbone.Marionette.Application();
  var _ = require('underscore');
  var app = require('core/app');

  /*
   * Attempts to resolve a template using the application's templates, falling
   * back to the default Marionette template on failure.
   */
  Backbone.Marionette.View.prototype.getTemplate = function () {
    var template = Backbone.Marionette.getOption(this, 'template');
    var t = _.isString(template) &&
      app.config &&
      app.config.templates &&
      app.config.templates[template];
    return t || template;
  };
