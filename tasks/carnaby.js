/*
 * carnaby
 * tasks/carnaby.js
 * https://github.com/elgrancalavera/grunt-carnaby
 *
 * Copyright (c) 2013 M&C Saatchi
 * Licensed under the MIT license.
 */
'use strict';
var path = require('path');
var fs = require('fs');

module.exports = function(grunt) {
  var helpers = require('./lib/helpers').init(grunt);
  var hbsOptions = require('./lib/handlebars-options').init(grunt);
  var html5bp = [
    '404.html',
    'apple*',
    'favicon.ico',
    'humans.txt',
    'robots.txt'
  ];

  // tasks that we need to run every time we update a client.
  var updateClientTasks = [
    'copy',
    'handlebars',
    'extend',
    'compass'
  ];

  // [template, destination] destination relative to base path (added later)

  var commonTemplates = [
    ['mainapp', 'common/scripts/app.js'],
    ['appcontroller', 'common/scripts/controllers/app-controller.js'],
    ['extensions', 'common/scripts/helpers/extensions.js'],
    ['handlebars-loader', 'common/scripts/helpers/handlebars-loader.js'],
    ['hbs', 'templates/main-view.hbs'],
    ['commonstylesheet', 'common/styles/_common.scss'],
    ['requirebase', 'config/base.json'],
  ];

  var clientTemplates = [
    ['app', 'scripts/app.js'],
    ['index', 'index.html'],
    ['hbs', 'templates/client-main-view.hbs'],
    ['clientstylesheet', 'styles/main.scss'],
    ['requiretarget', 'config/local.json'],
  ];

  var makeTemplateOptionsList = function (templatelist, basepath, options) {
    return grunt.util._.map(templatelist, function (args) {
      return grunt.util._.extend({
        template: args[0],
        filepath: path.join(basepath, args[1])
      }, options);
    });
  };

  var makeCommon = function (force) {
    var project = helpers.createProject(force).readProject();
    var options = {
      force: force
    };
    grunt.verbose.writeflags(options, 'makeCommon options');
    var templates = makeTemplateOptionsList(commonTemplates, 'core', options);
    processMultipleTemplates(templates);
  };

  var makeClient = function (name, description, force) {
    var client = helpers.createClient(name, description, force).readClient(name);
    var options = {
      force: force,
      client: client,
      context: {
        client: client,
        target: 'local'
      }
    };
    var templates = makeTemplateOptionsList(clientTemplates, name, options);
    processMultipleTemplates(templates);
    makeClientTasks(client);
  };

  var makeClientTasks = function (client) {
    var project = helpers.readProject();
    var dest, files, base;

    //----------------------------------
    //
    // copy:templates
    //
    //----------------------------------

    dest = path.join('.carnaby/tmp', client.name, 'templates');
    helpers.ensureTask(project, 'copy');
    project.tasks.copy[client.name] = {
      files: [{
        expand: true,
        cwd: '<%= carnaby.appDir %>/common/templates',
        src: ['**'],
        dest: dest
      }, {
        expand: true,
        cwd: path.join('<%= carnaby.appDir %>', client.name, 'templates'),
        src: ['**'],
        dest: dest
      }]
    };

    //----------------------------------
    //
    // handlebars
    //
    //----------------------------------

    dest = path.join('.carnaby/tmp', client.name, 'scripts/templates.js');
    files = {};
    files[dest] = [path.join('.carnaby/tmp', client.name, 'templates/**/*.hbs')];
    helpers.ensureTask(project, 'handlebars');
    project.tasks.handlebars[client.name] = {
      files: files
    };

    //----------------------------------
    //
    // extend:config
    //
    //----------------------------------

    files = {};
    helpers.ensureTask(project, 'extend');
    dest = path.join('.carnaby/tmp', client.name, 'config');

    files[path.join(dest, 'local.json')] = [
      '<%= carnaby.appDir %>/core/config/base.json',
      '<%= carnaby.appDir %>/core/config/local.json',
      path.join('<%= carnaby.appDir %>', client.name, 'config/base.json'),
      path.join('<%= carnaby.appDir %>', client.name, 'config/local.json')
    ];

    project.tasks.extend[client.name] = {
      options: {
        deep: true
      },
      files: files
    };

    //----------------------------------
    //
    // compass
    //
    //----------------------------------

    var srcbase = path.join('<%= carnaby.appDir %>/', client.name);
    var dstbase = path.join('.carnaby/tmp', client.name);
    var commonbase = path.join('<%= carnaby.appDir %>', 'core/common/styles');

    helpers.ensureTask(project, 'compass');
    project.tasks.compass[client.name] = {
      options: {
        sassDir: path.join(srcbase, 'styles'),
        cssDir: path.join(dstbase, 'styles'),
        imagesDir: path.join(srcbase, 'images'),
        fontsDir: path.join(commonbase, 'fonts'),
        javascriptsDir: path.join(srcbase, 'scripts'),
        importPath: commonbase,
        relativeAssets: true
      }
    };

    //----------------------------------
    //
    // Save: update should be handled
    // by the actual Gruntfile.
    //
    //----------------------------------

    helpers.saveProject(project);
  };

  var processTemplate = function (options) {

    grunt.log.debug('Processing template');
    grunt.log.debug(options.template);
    grunt.log.debug(options.filepath);

    var before = options.before || grunt.util._.identity;
    var base = options.base || helpers.appDir;
    grunt.log.debug(base);
    var dest = path.join(base, options.filepath);
    helpers.checkFile(dest, options.force);

    var extname = path.extname(options.filepath);
    var filename = path.basename(options.filepath);
    var filenamenoext = path.basename(options.filepath, extname);
    var dirname = path.dirname(options.filepath);
    var filepathnoext = path.join(dirname, filenamenoext);
    var template = before(helpers.getTemplate(options.template));

    var context = grunt.util._.extend(options.context || {}, {
      filename: filename,
      extname: extname,
      dirname: dirname,
      filepath: options.filepath,
      filenamenoext: filenamenoext,
      filepathnoext: filepathnoext
    });

    grunt.verbose.writeflags(options, 'Options');
    grunt.verbose.writeflags(context, 'Context');
    helpers.writeTemplate(dest, template, context);

  };

  var processMultipleTemplates = function (optionsList) {
    grunt.util._.each(optionsList, function (options) {
      processTemplate(options);
    });
  };

  var getTemplateOptions = function (task) {
    grunt.verbose.writeflags(task, 'Getting template options from');
    var args = helpers.removeFlags(task.args);
    if (args.length !== 2) {
      return helpers.usage(true);
    }
    var options = {
      filepath: path.normalize(grunt.util._.last(args)),
      template: grunt.util._.first(args),
      force: task.flags.force
    };
    grunt.verbose.writeflags(options, 'Template options');
    return options;
  };

  //--------------------------------------------------------------------------
  //
  // Tasks
  //
  //--------------------------------------------------------------------------

  /*
   * carnaby:ls[:property] A proxy for grunt.log.writeflags
   */
  grunt.registerTask('carnaby:ls', function () {
    var args = helpers.removeFlags(this.args);
    var project = helpers.readProject();
    var prop = args.shift();
    var msg = 'carnaby';
    var obj = project[prop];

    if (prop && obj) {
      msg += ':' + prop;
    }

    if (!obj && prop) {
      grunt.log.writeln(('"' + prop + '" field not found. Listing the whole project.').yellow);
    }

    if (!obj) {
      obj = project;
    }

    grunt.log.writeflags(obj, msg);
  });

  /*
   * carnaby:new-target:name:path[:description][:force] Writes the required
   *  files to enable a new deployment target and updates the project
   *  accordingly.
   *  :path is relative to the grunt's project root.
   */
  grunt.registerTask('carnaby:new-target', function () {
    var args = helpers.removeFlags(this.args);
    var force = this.flags.force;
    var name = args.shift();
    var pathName = args.shift();
    var desc = args.shift();
    if (!name) {
      grunt.fatal('You must provide a target name. Aborting.');
    }
    if (!pathName) {
      pathName = name;
      grunt.log.writeln(('Target path not specified. Will try to use "' + path.resolve(pathName) +'".').yellow);
    }
    var target = helpers.createTarget(name, pathName, desc, force);
    grunt.verbose.writeflags(target, 'new target created');

    // write all target json files
  });

  /*
   * carnaby:delete-target:name[:dry-run] Deletes an existing deployment target.
   *  :dry-run outputs the results of this operation without actually deleting
   *  anything.
   */
  grunt.registerTask('carnaby:delete-target', function () {
    var args = helpers.removeFlags(this.args);
    var dry = this.flags['dry-run'];
    var name = args.shift();
    var target = helpers.deleteTarget(name, dry);
    grunt.log.writeflags(target);
  });

  /*
   * carnaby:vendor-cherry-pick:vendor:file[:file_n][:force] Cherry picks files from a given
   * vendor and makes them part of the common code under version control
   */
  grunt.registerTask('carnaby:vendor-cherry-pick', function () {
    var args = helpers.removeFlags(this.args);
    var force = this.flags.force;
    var vendor = args.shift();
    var picks = args;
    if (!vendor) {
      grunt.fatal('Please specify a vendor to cherry pick from.');
    }
    var vendorDir = path.join(helpers.bowerDir, vendor);

    if (!grunt.file.exists(vendorDir)) {
      grunt.fatal('Unknown vendor "' + vendor +'". Maybe you forgot to run "bower install ' + vendor + ' --save"?', vendor);
    }

    if (!picks.length) {
      grunt.fatal('Please specify at least 1 file to pick.');
    }

    var cherryPicks = picks.reduce(function (expandedPicks, pick) {
      var pickPath = path.join(vendorDir, pick);

      var expanded = grunt.file.expand(pickPath);
      var noMatch = pickPath + ' didn\'n match any files.';

      if (!expanded.length && !force) {
        grunt.fatal(noMatch + '\nAppend ":force" at the end of your task to skip this batch.');
      }
      if (!expanded.length && force) {
        grunt.log.writeln((noMatch + ' Skipping.').yellow);
      }
      return expandedPicks.concat(expanded);
    }, []);

    grunt.verbose.writeln('vendor: %s', vendor);
    grunt.verbose.writeflags(cherryPicks, 'cherryPicks');

    cherryPicks.forEach(function (src) {
      var dest = path.join(helpers.appDir, 'core', path.relative(vendorDir, src));
      grunt.file.copy(src, dest);
    });

  });

  /*
   * carnaby:update-client[:client][:target] updates the generated files for a client
   * defaults to carnaby:update-client:mobile:local
   */
  grunt.registerTask('carnaby:update-client', function () {
    var force = this.flags.force;
    var args = helpers.removeFlags(this.args);
    var client = helpers.readClient(args[0]);
    var target = helpers.getTarget(args[1]);
    var clientTasks = grunt.util._.map(updateClientTasks, function (task) {
      return task + ':' + client.name;
    });
    clientTasks = [].concat(
      'carnaby:update-config',
      clientTasks,
      'carnaby:write-main:' + client.name + ':' + target,
      'carnaby:update-index'
    );
    grunt.verbose.writeflags(clientTasks, 'client tasks');
    grunt.task.run(clientTasks);
  });

  /*
   * carnaby:update-config updates the main grunt config file. We just update the
   * grunt config but we don't run the tasks. Once grunt is done, config
   * will be out of date again.
   */
  grunt.registerTask('carnaby:update-config', function () {
    var tasks = helpers.readProject().tasks;
    grunt.util._.each(tasks, function (clients, task) {
      grunt.verbose.writeflags(clients, task);
      grunt.util._.each(clients, function (config, client) {
        var target = task + '.' + client;
        grunt.verbose.writeflags(config, client);
        grunt.config(target, config);
        grunt.verbose.writeflags(grunt.config(target), target);

      });
    });
  });

  /*
   * carnaby:update-index updates the project index
   */
  grunt.registerTask('carnaby:update-index', function () {
    var clients = helpers.readProject().clients;
    grunt.verbose.writeflags(clients, 'clients');
    processTemplate({
      filepath: 'index.html',
      template: 'projectindex',
      force: true,
      context: {
        clients: clients
      }
    });
  });

  /*
   * carnaby:write-main[:client][:target] writes a main.js file
   * defaults to carnaby:write-main:mobile:local
   */
  grunt.registerTask('carnaby:write-main', function () {
    this.requires(['carnaby:update-config']);
    var args = helpers.removeFlags(this.args);
    var targets = ['local', 'dev', 'qa', 'prod'];
    var client = helpers.readClient(args[0]);
    var target = helpers.getTarget(args[1]);
    var source = path.join('.carnaby/tmp', client.name, 'config', target + '.json');
    grunt.log.debug('config source:', source);
    var context = {
      config: grunt.file.read(source)
    };
    processTemplate({
      filepath: path.join(client.name, 'scripts/main.js'),
      template: 'main',
      force: true,
      context: context,
      base: target === 'local' ? '.carnaby/tmp' : 'dist'
    });
  });

  /*
   * carnaby:template carnaby template task
   */
  grunt.registerTask('carnaby:template', function() {
    var options = getTemplateOptions(this);
    processTemplate(options);
  });

  /*
   * carnaby:init-template carnaby template for grunt-init-carnaby
   *  ti templates don't replace any template tokens, just change their syntax
   *  and leaves them in place to be used developing grunt-init-carnaby
   */
  grunt.registerTask('carnaby:init-template', function () {
    var options = getTemplateOptions(this);
    options.before = function (template) {
      return template.replace(/<%/g, '{%').replace(/%>/g, '%}');
    };
    processTemplate(options);
  });

  /*
   * carnaby:new-client[:client] generates a carnaby client application
   * defaults to carnaby:new-client:mobile
   */
  grunt.registerTask('carnaby:new-client', function () {
    var args = helpers.removeFlags(this.args);
    var name = args[0] || helpers.defaultclientname;
    var desc = args[1] || helpers.defaultclientdesc;
    var force = this.flags.force;
    makeClient(name, desc, force);
    grunt.task.run(helpers.checkForce(['carnaby:update-client:' + name], force));
  });

  /*
   * carnaby:new-project
   */
  grunt.registerTask('carnaby:new-project', function () {
    var force = this.flags.force;

    var vendorCherryPick =
      ['carnaby', 'vendor-cherry-pick', 'html5-boilerplate']
      .concat(html5bp).join(':');

    grunt.task.run(helpers.checkForce([
      'carnaby:new-client',
      vendorCherryPick
    ], force));

    makeCommon(force);

  });
};
