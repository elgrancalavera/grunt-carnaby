'use strict';

exports.init = function (grunt) {
  var exports = {};
  var helpers = require('./helpers').init(grunt);

  exports.Client = function (project, options) {
    if (!project) {
      grunt.fatal('You need to install the carnaby project before creating clients.');
    }
    this.project = project;
    this.options = options || {};
  };

  return exports;
};
