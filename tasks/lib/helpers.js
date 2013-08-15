'use strict';
 var path = require('path');

exports.init = function (grunt) {

  var filesdir = path.join(__dirname, '..', 'files');
  var txtdir = path.join(filesdir, 'txt');
  var templatesdir = path.join(filesdir, 'templates');
  var exports = {};

  var templates = {};

  templates.def = [
    'js/header.js',
    'js/footer.js'
  ];

  templates.amd = [
    'js/header.js',
    'js/header-amd.js',
    'js/footer-amd.js',
    'js/footer.js'];

  templates.html = [
    'html/header.html',
    'html/body.html',
    'html/footer.html'
  ];

  templates.sugar = templates.amd;

  var getTemplate = function (name) {
    var definition = templates[name];
    if (!definition) {
      grunt.fatal('Unknown template definition: "' + name + '"');
    }
    var txt = grunt.util._.reduce(definition, function (txt, filepath) {
      filepath = path.join(templatesdir, filepath);
      return txt + grunt.file.read(filepath);
    }, '');
    return txt;
  };

  exports.usage = function () {
    var usage = grunt.file.read(path.join(txtdir, 'usage.txt'));
    grunt.log.writeln(usage.cyan);
  };

  var readPackage = exports.readPackage = function () {
    return grunt.file.readJSON('package.json');
  };

  exports.getTemplate = function (name) {
    if (!name) {
      return getTemplate('def');
    }
    return getTemplate(name);
  };

  return exports;
};

