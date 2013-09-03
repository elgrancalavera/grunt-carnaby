/*
 * carnaby
 * tasks/lib/helpers.js
 * https://github.com/elgrancalavera/grunt-carnaby
 *
 * Copyright (c) 2013 M&C Saatchi
 * Licensed under the MIT license.
 */
'use strict';
var path = require('path');
var templates = require('./templates');

exports.init = function (grunt) {

  var config = grunt.config('carnaby');
  var appDir = grunt.config('carnaby.appDir') || grunt.config('carnaby.appDir', 'app');

  var filesdir = path.join(__dirname, '..', 'files');
  var projectfile = '.carnaby/project.json';
  var defaultclientname = 'mobile';
  var defaultclientdesc = 'Another Carnaby client';
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

  var saveProject = exports.saveProject = function (project) {
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
      grunt.fatal(existsMsg + abortmsg);
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

    project.clients[name] = {
      name: name,
      description: description || '',
      root: path.join(appDir, name)
    };
    project = saveProject(project);
    return exports;
  };

  var readClient = exports.readClient = function (name) {
    name = name || defaultclientname;
    var clients = readProject().clients;
    var client = clients[name];
    grunt.verbose.writeflags(clients, 'known clients');
    if (!client) {
      grunt.fatal('Unknown client "' + name + '". Aborting.' );
    }
    grunt.verbose.writeflags(client, name);
    return client;
  };

  exports.ensureTask = function (project, taskname) {
    if (!project.tasks[taskname]) {
      project.tasks[taskname] = {};
    }
  };

  exports.defaultclientname = defaultclientname;
  exports.defaultclientdesc = defaultclientdesc;
  exports.appDir = appDir;

  return exports;
};

