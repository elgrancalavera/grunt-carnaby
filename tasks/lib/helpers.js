'use strict';
 var path = require('path');
 var templates = require('./templates');

exports.init = function (grunt) {

  var filesdir = path.join(__dirname, '..', 'files');
  var projectfile = '.carnaby/project.json';
  var defaultclient = 'mobile';
  var exports = {};
  // flags (to be removed before doing stuff):
  var flags = [
    'force'
  ];

  var abortmsg = ' Aborting.\nAppend ":force" at the end of your task call to overwrite.';
  var overwritemsg = 'Overwriting.';

  //--------------------------------------------------------------------------
  //
  // Helpers
  //
  //--------------------------------------------------------------------------

  var fatal = function (msg) {

  };

  var makeReader = function (reader, basedir) {
    return function (filepath) {
      var p = path.join(filesdir, basedir, filepath);
      return reader.call(grunt, p);
    };
  };

  var makeFileReader = function (basedir) {
    return makeReader(grunt.file.read, basedir);
  };

  var readTxt = makeFileReader('txt');
  var readTemplate = makeFileReader('templates');
  var readJSON = makeReader(grunt.file.readJSON, 'json');

  var getTemplate = function (name) {
    var definition = templates[name];
    if (!definition) {
      grunt.fatal('Unknown template definition: "' + name + '"');
    }
    return grunt.util._.reduce(definition, function (txt, filepath) {
      return txt + readTemplate(filepath);
    }, '');
  };

  var updateProject = function (project) {
    project = JSON.stringify(project, null, 2);
    grunt.file.write(projectfile, project);
    return readProject();
  };

  //--------------------------------------------------------------------------
  //
  // Exported stuff
  //
  //--------------------------------------------------------------------------

  exports.usage = function (fatal) {
    grunt.log.writeln(readTxt('usage.txt').cyan);
    grunt.fatal('Unable to contine.');
  };

  var readPackage = exports.readPackage = function () {
    return grunt.file.readJSON('package.json');
  };

  exports.getTemplate = function (name) {
    return getTemplate(name || 'def');
  };

  var checkFile = exports.checkFile = function (filepath, force) {
    var exists = grunt.file.exists(filepath);
    grunt.verbose.writeln((filepath + 'already exists?').cyan, exists.toString().yellow);
    var existsMsg = '"' + filepath  + '" already exists. ';
    if (exists && !force) {
      grunt.fatal(existsMsg + overwritemsg);
    }
    if (exists && force) {
      grunt.log.writeln((existsMsg + overwritemsg).yellow);
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

  var readProject = exports.readProject = function () {
    return grunt.file.readJSON(projectfile);
  };

  exports.createProject = function (force) {
    checkFile(projectfile, force);
    grunt.file.copy(path.join(filesdir, 'json/project.json'), projectfile);
    return exports;
  };

  var createClient = exports.createClient = function (name, description, force) {
    var project = readProject();
    if (!name) {
      grunt.fatal('Please provide a name for your client.');
    }
    if (project.clients[name] && !force) {
      grunt.fatal('The "' + name + '" client already exists.' + abortmsg);
    }
    var root = grunt.option('appDir');
    project.clients[name] = {
      name: name,
      description: description || '',
      root: path.join(root, 'clients', name)
    };
    project = updateProject(project);
    return exports;
  };

  exports.createDefaultClient = function (force) {
    return createClient(defaultclient, null, force);
  };

  var readClient = exports.readClient = function (name) {
    var client = readProject().clients[name];
    if (!client) {
      var msg = 'Unable to read unknown client "' + name + '".';
      grunt.fatal(msg);
    }
    return client;
  };

  exports.readDefaultClient = function () {
    return readClient(defaultclient);
  };

  exports.defaultclient = defaultclient;

  return exports;
};

