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
  var bowerDir = grunt.config('carnaby.bowerDir') || 'bower_components';
  var filesdir = path.join(__dirname, '..', 'files');
  var projectfile = '.carnaby/project.json';
  var defaultclientname = 'mobile';
  var defaulttargetname = 'production';
  var defaultclientdesc = 'Another Carnaby client';
  var exports = {};
  // flags (to be removed before doing stuff):
  var flags = [
    'force',
    'dry-run'
  ];

  var abortmsg = ' Aborting.\nAppend ":force" at the end of your task call to overwrite.';
  var overwritemsg = 'Overwriting.';

  //--------------------------------------------------------------------------
  //
  // Helpers
  //
  //--------------------------------------------------------------------------

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

  var writeTemplate = exports.writeTemplate = function (dest, template, context) {
    context = grunt.util._.extend(readPackage(), context);
    grunt.file.write(dest, grunt.template.process(template, {data: context}));
    grunt.log.ok('File "%s" written.', dest);
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
    var template = getTemplate('project');
    writeTemplate(projectfile, template);
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

  var readClient = exports.readClient = function (name, lenient) {
    name = name || defaultclientname;
    var clients = readProject().clients;
    var client = clients[name];
    grunt.verbose.writeflags(clients, 'known clients');
    if (!client && !lenient) {
      grunt.fatal('Unknown client "' + name + '". Aborting.');
    }
    grunt.verbose.writeflags(client, name);
    return client;
  };

  var readTarget = exports.readTarget = function (name, lenient) {
    name = name || defaulttargetname;
    var targets = readProject().targets;
    var target = targets[name];
    if (!target && !lenient) {
      grunt.fatal('Unknown target "' + name + '". Aborting.');
    }
    grunt.verbose.writeflags(target, name);
    return target;
  };

  exports.getTarget = function (target) {
    var knownTargets = ['local', 'dev', 'qa', 'prod'];
    target = target || knownTargets[0];
    if (!grunt.util._.contains(knownTargets, target)) {
      grunt.fatal('Unknown build target:"' + target + '". Aborting');
    }
    return target;
  };

  exports.ensureTask = function (project, taskname) {
    if (!project.tasks[taskname]) {
      project.tasks[taskname] = {};
    }
  };

  exports.createTarget = function (name, pathName, description, force) {
    var project = readProject();
    var targets = project.targets;
    var existsmsg = 'Target "' + name + '" already exists. ';
    var exists = !!readTarget(name, true);

    if (exists && !force) {
      grunt.fatal(existsmsg + abortmsg);
    }
    if (exists && force) {
      grunt.log.writeln((existsmsg + overwritemsg).yellow);
    }

    grunt.util._.each(targets, function (target, key) {
      if (target.path === pathName && key !== name) {
        grunt.fatal('The provided path is already in use by the "' +
          key + '" target. Aborting.');
      }
    });

    targets[name] = {
      name: name,
      path: pathName,
      description: description
    };

    saveProject(project);
  };

  exports.deleteTarget = function (name, dry) {
    var target = readTarget(name);
    var project = readProject();

    if (grunt.util._.keys(project.targets).length === 1) {
      grunt.fatal('\nThere is only one (1) deployment target remaining in ' +
        'your project.\nCarnaby requires at least one (1) deployment target.' +
        '\nAborting.');
    }

    grunt.log.writeflags(target, 'deleting target');

    if (dry) {
      grunt.log.writeln('Stopping before deleting as requested.'.yellow);
      return target;
    }

    delete project.targets[name];
    saveProject(project);
    return target;
  };


  exports.defaultclientname = defaultclientname;
  exports.defaultclientdesc = defaultclientdesc;
  exports.appDir = appDir;
  exports.bowerDir = bowerDir;

  return exports;
};

