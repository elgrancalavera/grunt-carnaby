  var _ = require('underscore');

  /*
   * `common/controllers/app-controller` must be the first one requiring
   * `common/app`.
   */
  var app = require('common/app');

  /*
   * Initialisation than can be safely shared across different and possible
   * unknown clients. Any client specific initialisation routine must be moved
   * to the client-specific application bootstrapping file.
   */
  app.addInitializer(function (options) {
    app.config = _.extend(module.config(), options.config);
  });

  /*
   * Any routine that must be run for all possible clients after startup. See
   * previous comment.
   */
  app.on('start', function(options) {

  });

  exports.app = app;

