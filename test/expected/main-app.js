/*
 * grunt-carnaby
 * main-app.js
 * git://github.com/elgrancalavera/grunt-carnaby.git
 * Copyright (c) 2013 M&C Saatchi
 * mcsaatchi.com
 */
define(function (require, exports, module) {
  'use strict';
  var Backbone = require('backbone');
  require('backbone.marionette');
  exports = new Backbone.Marionette.Application();
  return exports;
});
