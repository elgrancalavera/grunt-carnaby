'use strict';
 var path = require('path');
 var templates = require('./templates');

exports.init = function (grunt) {

  var filesdir = path.join(__dirname, '..', 'files');
  var txtdir = path.join(filesdir, 'txt');
  var templatesdir = path.join(filesdir, 'templates');
  var exports = {};
  // flags (to be removed before doing stuff):
  var flags = [
    'force'
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

  exports.checkFile = function (filepath, force) {
    var exists = grunt.file.exists(filepath);
    grunt.verbose.writeln((filepath + 'already exists?').cyan, exists.toString().yellow);
    var existsMsg = '"' + filepath  + '" already exists. ';
    if (exists && !force) {
      grunt.fatal(
        existsMsg +
        'Aborting.\nAppend ":force" at the end of your task call to overwrite it.'
      );
    }
    if (exists && force) {
      grunt.log.writeln((existsMsg + 'Overwriting.').yellow);
    }
  };

  exports.checkForce = function (tasks, force) {
    return grunt.util._.map(tasks, function (task) {
      return force ? task + ':force' : task;
    });
  };

  exports.removeFlags = function (args) {
    return grunt.util._.without.apply(null, [].concat([args], flags));
  };

  return exports;
};

