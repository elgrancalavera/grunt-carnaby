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
  var html5bpCherryPick = [
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

  var makeTemplateOptionsList = function (templatelist, basepath, options) {
    return grunt.util._.map(templatelist, function (args) {
      return grunt.util._.extend({
        template: args[0],
        filepath: path.join(basepath, args[1])
      }, options);
    });
  };

  var _updateClientTasks = function (client) {
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

    // then for each target ...
    var targets = helpers.readProject().targets;
    grunt.util._.each(targets, function (target, targetName) {
      files[path.join(dest, targetName + '.json')] = [
        '<%= carnaby.appDir %>/core/config/base.json',
        path.join('<%= carnaby.appDir %>', client.name, 'config/base.json'),
        path.join('<%= carnaby.appDir %>', client.name, 'config', targetName + '.json'),
      ];
    });

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
    grunt.verbose.writeflags(options, 'processing template');
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
      grunt.log.writeln(('Target path not specified. Will try to use "' + path.resolve(helpers.targetDir, pathName) +'".').yellow);
    }
    var target = helpers.createTarget(name, pathName, desc, force);

    // change this to use grunt.util._.keys(clients) instead...
    var clients = helpers.readProject().clients;
    var templateList = [['requiretarget', path.join('config', name + '.json')]];
    var templateOptions = {
      context: { target: name },
      force: force
    };
    var coreTemplates = makeTemplateOptionsList(templateList, 'core', templateOptions);
    var templates = grunt.util._.reduce(clients, function (templates, client, key) {
      return templates.concat(makeTemplateOptionsList(templateList, key, templateOptions));
    }, coreTemplates);

    grunt.util._.each(templates, processTemplate);
    grunt.verbose.writeflags(target, 'new target created');

    // then we need to update some of the clients tasks... and since there is
    // no other way to do it yet, I'm just updating the whole lot again.
    grunt.util._.each(clients, _updateClientTasks);
    grunt.task.run(['carnaby:update-config', 'extend']);

    grunt.log.ok();
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
    var clients = helpers.readProject().clients;

    var files = grunt.util._.reduce(clients, function (files, client) {
      return files.concat(client.root);
    }, [path.join(helpers.appDir, 'core')]).map(function (file) {
      return path.join(file, 'config', name + '.json');
    });

    grunt.log.writeflags(files, 'deleting files');

    if (dry) {
      return grunt.log.writeln('Stopping before deleting files are requested.'.yellow);
    }

    var taskid = helpers.utid('clean');
    grunt.config(taskid.property, files);
    grunt.log.writeflags(grunt.config('clean'), 'clean');
    grunt.task.run(taskid.task);

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
    grunt.verbose.writeflags(cherryPicks, 'cherry picks');

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
    var client = args.shift();
    var target = args.shift();
    client = helpers.readClient(client);
    target = helpers.readTarget(target);
    var clientTasks = grunt.util._.map(updateClientTasks, function (task) {
      return task + ':' + client.name;
    });
    clientTasks = [].concat(
      'carnaby:update-config',
      clientTasks,
      'carnaby:write-main:' + client.name + ':' + target.name,
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
    var client = args.shift() || helpers.defaultclientname;
    var target = args.shift() || helpers.defaulttargetname;

    client = helpers.readClient(client);
    target = helpers.readTarget(target);

    var source = path.join('.carnaby/tmp', client.name, 'config', target.name + '.json');

    var context = {
      config: grunt.file.read(source)
    };

    var base = target.name === helpers.defaulttargetname ?
      '.carnaby/tmp' : target.path;

    processTemplate({
      filepath: path.join(client.name, 'scripts/main.js'),
      template: 'main',
      force: true,
      context: context,
      base: base
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
    var force = this.flags.force;
    var args = helpers.removeFlags(this.args);
    var name = args.shift() || helpers.defaultclientname;
    var desc = args.shift() || helpers.defaultclientdesc;

    // Step 1: Create the actual client entry in the project and all the client
    // files derived from templates.
    var client = helpers.createClient(name, desc, force);
    var templates = makeTemplateOptionsList([
        // [template, destination] destination relative to base path (added later)
        ['app', 'scripts/app.js'],
        ['index', 'index.html'],
        ['hbs', 'templates/client-main-view.hbs'],
        ['clientstylesheet', 'styles/main.scss'],
        ['requiretarget', 'config/base.json'],
      ],
      // base path (relative to helpers.appDir)
      client.name,
      // options
      {
        force: force,
        client: client,
        context: {
          client: client
        }
      }
    );
    grunt.util._.each(templates, processTemplate);

    // Step 2: Once the client files are ready, add a blank configuration file
    // for each target.
    grunt.util._.each(helpers.readProject().targets, function (target) {
      processTemplate({
        context: {target: target.name},
        template: 'requiretarget',
        filepath: path.join(client.name, 'config', target.name + '.json')
      });
    });

    // Step 3: Write all the tasks needed for this client to the project file
    // this bit actually writes tasks to the project file. maybe it should be
    // handled in a separate file, specialised to write tasks and update
    // `grunt.config()`
    _updateClientTasks(client);

    // Step 4: Update all artifacts for this client
    grunt.task.run(helpers.checkForce([
      'carnaby:update-client:' + name,
    ], force));
  });

  /*
   * carnaby:new-project
   */
  grunt.registerTask('carnaby:new-project', function () {
    var force = this.flags.force;

    // Step 1: Create the actual project and all the project files
    // derived from templates.
    var project = helpers.createProject(force);
    var templates = makeTemplateOptionsList([
        // [template, destination] destination relative to base path
        ['mainapp', 'common/scripts/app.js'],
        ['appcontroller', 'common/scripts/controllers/app-controller.js'],
        ['extensions', 'common/scripts/helpers/extensions.js'],
        ['handlebars-loader', 'common/scripts/helpers/handlebars-loader.js'],
        ['hbs', 'templates/main-view.hbs'],
        ['commonstylesheet', 'common/styles/_common.scss'],
        ['requirebase', 'config/base.json'],
      ],
      // base path (relative to helpers.appDir)
      'core',
      // options
      {
        force: force
      }
    );
    grunt.util._.each(templates, processTemplate);

    // Step 2: Run all other tasks that depend on a well defined project
    // to work properly.
    var vendorCherryPick =
      ['carnaby', 'vendor-cherry-pick', 'html5-boilerplate']
      .concat(html5bpCherryPick).join(':');

    grunt.task.run(helpers.checkForce([
      vendorCherryPick,
      'carnaby:new-client',
    ], force));

  });
};
