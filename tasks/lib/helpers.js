'use strict';
 var path = require('path');

exports.init = function (grunt) {

  var filesdir = path.join(__dirname, '..', 'files');
  var txtdir = path.join(filesdir, 'txt');
  var templatesdir = path.join(filesdir, 'templates');
  var exports = {};

  //--------------------------------------------------------------------------
  //
  // Template definitions
  //
  //--------------------------------------------------------------------------

  var templates = {};

  //----------------------------------
  //
  // JS
  //
  //----------------------------------

  templates.def = [
    'js/header.js',
    'js/footer.js'
  ];

  templates.amd = [
    'js/header.js',
    'js/header-amd.js',
    'js/footer-amd.js',
    'js/footer.js'
  ];

  // Just because I like this alias :)
  templates.sugar = templates.amd;

  //----------------------------------
  //
  // HTML
  //
  //----------------------------------

  // A very simple HTML template
  templates.html = [
    'html/header.html',
    'html/styles.html',
    'html/body.html',
    'html/scripts.html',
    'html/footer.html'
  ];

  // Just like the previous one but assumes an AMD app
  // will be embedded in the page.
  templates.index = [
    'html/header.html',
    'html/styles.html',
    'html/styles-index.html',
    'html/body.html',
    'html/body-index.html',
    'html/scripts.html',
    'html/scripts-index.html',
    'html/footer.html'
  ];

  //--------------------------------------------------------------------------
  //
  // Helpers
  //
  //--------------------------------------------------------------------------

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

  //--------------------------------------------------------------------------
  //
  // Exported stuff
  //
  //--------------------------------------------------------------------------

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

