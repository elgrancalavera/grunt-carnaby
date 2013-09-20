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

  var exports = {};
  var config = grunt.config('carnaby');
  var appDir = grunt.config('carnaby.appDir') || grunt.config('carnaby.appDir', 'app');
  var targetDir = grunt.config('carnaby.targetDir') || grunt.config('carnaby.targetDir', '.');
  var bowerDir = grunt.config('carnaby.bowerDir') || 'bower_components';
  var vendorDir = grunt.config('carnaby.vendorDir') || grunt.config('carnaby.vendorDir', 'vendor');
  var filesdir = path.join(__dirname, '..', 'files');
  var projectfile = '.carnaby/project.json';
  var defaultclientname = 'mobile';
  var defaulttargetname = 'local';
  var defaultclientdesc = 'Another Carnaby client';
  var abortmsg = ' Aborting.\nAppend ":force" at the end of your task call to overwrite.';
  var overwritemsg = 'Overwriting.';
  // flags (to be removed before using the positional arguments):
  var flags = [
    'force',
    'dry-run',
    'all'
  ];

  var readTemplate = exports.readTemplate = function (name) {
    var definition = templates[name];
    if (!definition) {
      grunt.fatal('Unknown template definition: "' + name + '"');
    }
    return grunt.util._.reduce(definition, function (txt, filepath) {
      return txt + grunt.file.read(path.join(filesdir, 'templates', filepath));
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

  var readPackage = exports.readPackage = function () {
    return grunt.file.readJSON('package.json');
  };

  var checkFile = exports.checkFile = function (filepath, force) {
    var exists = grunt.file.exists(filepath);
    grunt.verbose.writeln((filepath + ' already exists?').cyan, exists.toString().yellow);
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
    writeTemplate(projectfile, readTemplate('project'));
    createTarget(defaulttargetname, defaulttargetname, '', force);
    var project = readProject();
    grunt.verbose.writeflags(project, 'new project');
    return project;
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
    return project.clients[name];
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

  exports.ensureTask = function (project, taskname) {
    if (!project.tasks[taskname]) {
      project.tasks[taskname] = {};
    }
  };

  var createTarget = exports.createTarget = function (name, pathName, description, force) {
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
      path: path.join(targetDir, pathName),
      description: description || ''
    };

    saveProject(project);
    return targets[name];
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
      grunt.log.writeln('Stopping before saving changes to project.json as requested.'.yellow);
      return target;
    }

    delete project.targets[name];
    saveProject(project);
    return target;
  };

  var uid = exports.uid = function () {
    return '_' + Date.now();
  };

  exports.utid = function (task) {
    if (!task) {
      grunt.fatal('We need a task to make a task uid.');
    }
    var id = [task, task + uid()];
    return {
      property: id.join('.'),
      task: id.join(':')
    };
  };

  exports.run = function () {
    var description = ['carnaby'].concat(grunt.util.toArray(arguments));
    grunt.verbose.writeflags(description, 'runtask');
    return description.join(':');
  };

  var look = function (what, color) {
    grunt.verbose.writeln(what[color || 'yellow']);
  };

  var lookdown = exports.lookdown = function (color) {
    var arrow = "\n" +
      "    .\n" +
      "      .\n" +
      "  . ;.\n" +
      "   .;\n" +
      "    ;;.\n" +
      "  ;.;;\n" +
      "  ;;;;.\n" +
      "  ;;;;;\n" +
      "  ;;;;;\n" +
      "  ;;;;;\n" +
      "  ;;;;;\n" +
      "  ;;;;;\n" +
      "..;;;;;..\n" +
      " ':::::'\n" +
      "   ':`\n";
    look(arrow, color);
  };

  var lookup = exports.lookup = function (color) {
    var arrow = "\n" +
      "    .\n" +
      "  .:;:.\n" +
      ".:;;;;;:.\n" +
      "  ;;;;;\n" +
      "  ;;;;;\n" +
      "  ;;;;;\n" +
      "  ;;;;;\n" +
      "  ;:;;;\n" +
      "  : ;;;\n" +
      "    ;:;\n" +
      "  . :.;\n" +
      "    . :\n" +
      "  .   .\n" +
      "     .\n";
    look(arrow, color);
  };

  exports.unicorn = function (color) {
    var u = "\n" +
      "                                                    /\n" +
      "                                                  .7\n" +
      "                                       \\       , //\n" +
      "                                       |\\.--._/|//\n" +
      "                                      /\\ ) ) ).'/\n" +
      "                                     /(  \\  // /\n" +
      "                                    /(   J`((_/ \\\n" +
      "                                   / ) | _\\     /\n" +
      "                                  /|)  \\  eJ    L\n" +
      "                                 |  \\ L \\   L   L\n" +
      "                                /  \\  J  `. J   L\n" +
      "                                |  )   L   \\/   \\\n" +
      "                               /  \\    J   (\\   /\n" +
      "             _....___         |  \\      \\   \\```\n" +
      "      ,.._.-'        '''--...-||\\     -. \\   \\\n" +
      "    .'.=.'                    `         `.\\ [ Y\n" +
      "   /   /                                  \\]  J\n" +
      "  Y / Y                                    Y   L\n" +
      "  | | |          \\                         |   L\n" +
      "  | | |           Y                        A  J\n" +
      "  |   I           |                       /I\\ /\n" +
      "  |    \\          I             \\        ( |]/|\n" +
      "  J     \\         /._           /        -tI/ |\n" +
      "   L     )       /   /'-------'J           `'-:.\n" +
      "   J   .'      ,'  ,' ,     \\   `'-.__          \\\n" +
      "    \\ T      ,'  ,'   )\\    /|        ';'---7   /\n" +
      "     \\|    ,'L  Y...-' / _.' /         \\   /   /\n" +
      "      J   Y  |  J    .'-'   /         ,--.(   /\n" +
      "       L  |  J   L -'     .'         /  |    /\\\n" +
      "       |  J.  L  J     .-;.-/       |    \\ .' /\n" +
      "       J   L`-J   L____,.-'`        |  _.-'   |\n" +
      "        L  J   L  J                  ``  J    |\n" +
      "        J   L  |   L                     J    |\n" +
      "         L  J  L    \\                    L    \\\n" +
      "         |   L  ) _.'\\                    ) _.'\\\n" +
      "         L    \\('`    \\                  ('`    \\\n" +
      "          ) _.'\\`-....'                   `-....'\n" +
      "         ('`    \\\n" +
      "          `-.___/\n";
    look(u, color || 'magenta');
  };

  exports.defaultclientname = defaultclientname;
  exports.defaultclientdesc = defaultclientdesc;
  exports.defaulttargetname = defaulttargetname;
  exports.appDir = appDir;
  exports.bowerDir = bowerDir;
  exports.targetDir = targetDir;
  exports.vendorDir = vendorDir;

  return exports;
};

