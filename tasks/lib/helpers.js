'use strict';
 var path = require('path');

exports.init = function (grunt) {

  var filesdir = path.join(__dirname, '..', 'files');
  var txtdir = path.join(filesdir, 'txt');
  var templatesdir = path.join(filesdir, 'templates');
  var exports = {};

  exports.usage = function () {
    var usage = grunt.file.read(path.join(txtdir, 'usage.txt'));
    grunt.log.writeln(usage.cyan);
  };

  var readPackage = exports.readPackage = function () {
    return grunt.file.readJSON('package.json');
  };

  var defaultTemplate = function () {
    var parts = [
      path.join(templatesdir, 'js', 'header.js')
    ];
    var template = grunt.util._.reduce(parts, function (tpl, filepath) {
      return tpl + grunt.file.read(filepath);
    }, '');
    return template;
  };

  exports.getTemplate = function (filepath) {
    if (!filepath) {
      return defaultTemplate();
    }
    return grunt.file.read(filepath);
  };

  return exports;
};

