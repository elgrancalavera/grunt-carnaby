/*
 * {%= name %}
 * {%= filepath %}
 * {%= repository.url %}
 * Copyright (c) {%= grunt.template.today('yyyy') %} {%= author.name %}
 * {%= author.url %}
 */
define(function (require, exports, module) {
  'use strict';
  var Backbone = require('backbone');
  require('backbone.marionette');
  exports = new Backbone.Marionette.Application();
  return exports;
});
