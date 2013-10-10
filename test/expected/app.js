/*
 * grunt-carnaby
 * app.js
 * git://github.com/elgrancalavera/grunt-carnaby.git
 * Copyright (c) 2013 M&C Saatchi
 * mcsaatchi.com
 */
define(function (require, exports, module) {
  'use strict';

  /*
   * Extensions to prototypes from loaded libraries (Backbone, Marionette...)
   */
  require('common/helpers/extensions');

  /*
   * Templates are defined in the client's configuration file, and will point
   * ultimately to the compiled templates for this client.
   */
  var templates = require('templates');

  /*
   * `common/controllers/app-controller` must be required before we actually do
   * anything else, to give it a chance to require and add initialisers to
   * `common/app` before any other part of our code.
   */
  var appController = require('common/controllers/app-controller');
  var app = appController.app;

  /*
   * Prepare the main region for the app.
   */
  app.addRegions({
    content: '#content',
    sidebar: '#sidebar'
  });

  /*
   * Now we get a chance to add our own initializers and event handlers to
   * `common/app`, via `common/controllers/app-controller`.
   */
  appController.app.addInitializer(function (options) {
    app.content.show(new Backbone.Marionette.ItemView({
      template: templates.content,
      model: new Backbone.Model(options.config)
    }));
    app.sidebar.show(new Backbone.Marionette.ItemView({
      template: templates.sidebar
    }));
  });

  /*
   * Anything that should be done after the application starts.
   */
  appController.app.on('start', function (options) {

  });

  /*
   * Finally we can start the application, passing any module specific
   * configuration.
   */
  appController.app.start({
    config: module.config()
  });

  return exports;
});
