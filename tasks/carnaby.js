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

module.exports = function (grunt) {
  var helpers = require('./lib/helpers').init(grunt);
  var handlebarsOptions = require('./lib/handlebars-options').init(grunt);

  var mountFolder = function (connect, dir) {
    return connect.static(path.resolve(dir));
  };

  var makeTemplateOptionsList = function (templatelist, basepath, options) {
    grunt.log.writeflags(templatelist);
    grunt.log.writeln(basepath);
    grunt.log.writeflags(options);
    return grunt.util._.map(templatelist, function (args) {
      return grunt.util._.extend({
        template: args[0],
        filepath: path.join(basepath, args[1])
      }, options);
    });
  };

  var updateTasks = function (client) {

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
        cwd: '<%= carnaby.appDir %>/core/templates',
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
    // watch
    //
    //----------------------------------

    helpers.ensureTask(project, 'watch');

    project.tasks.watch[client.name + '_handlebars'] = {
      files: [
        path.join('<%= carnaby.appDir %>', 'core/templates/**/*.hbs'),
        path.join('<%= carnaby.appDir %>', client.name, 'templates/**/*.hbs')
      ],
      tasks: [
        helpers.runVendor('copy', client.name),
        helpers.runVendor('handlebars', client.name)
      ]
    };

    project.tasks.watch[client.name + '_jshint'] = {
      files: [
        path.join('<%= carnaby.appDir %>', client.name, 'scripts/**/*.js')
      ],
      tasks: [
        helpers.runVendor('jshint', client.name)
      ]
    };

    project.tasks.watch[client.name + '_compass'] = {
      files: [
        path.join('<%= carnaby.appDir %>', 'core/common/styles/**/*.{scss,sass}'),
        path.join('<%= carnaby.appDir %>', client.name, 'styles/**/*.{scss,sass}')
      ],
      tasks: [
        helpers.runVendor('compass', client.name)
      ]
    };

    project.tasks.watch[client.name + '_config'] = {
      files: [
        path.join('<%= carnaby.appDir %>', 'core/config/*.json'),
        path.join('<%= carnaby.appDir %>', client.name, 'config/*.json')
      ],
      tasks: [
        helpers.runVendor('extend', client.name),
        helpers.run('write-main', client.name)
      ]
    };

    //----------------------------------
    //
    // js hint
    //
    //----------------------------------

    helpers.ensureTask(project, 'jshint');
    project.tasks.jshint[client.name] = {
      options: {
        jshintrc: '.jshintrc'
      },
      files: {
        src: path.join('<%= carnaby.appDir %>', client.name, 'scripts/**/*.js')
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

    var before = options.before || grunt.util._.identity;
    var base = options.base || helpers.appDir;
    var dest = path.join(base, options.filepath);
    var extname = path.extname(options.filepath);
    var filename = path.basename(options.filepath);
    var filenamenoext = path.basename(options.filepath, extname);
    var dirname = path.dirname(options.filepath);
    var filepathnoext = path.join(dirname, filenamenoext);
    var template = before(helpers.readTemplate(options.template));

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

    // show-stopper party-pooper
    helpers.checkFile(dest, options.force);
    helpers.writeTemplate(dest, template, context);
  };

  var getTemplateOptions = function (task) {
    var args = helpers.removeFlags(task.args);
    if (args.length !== 2) {
      grunt.fatal('');
    }
    var options = {
      filepath: path.normalize(grunt.util._.last(args)),
      template: grunt.util._.first(args),
      force: task.flags.force
    };
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
    grunt.util._.each(clients, updateTasks);
    var tasks = [
      helpers.run('update-config')
    ].concat(
      helpers.runAllClients('extend', null, true),
      helpers.run('update-index')
    );
    grunt.task.run(tasks);
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

    // each config from each client
    var files = grunt.util._.map(clients, function (client) {
      return path.join(client.root, 'config', target.name + '.json');
    });

    // target, core target config and .preflight artifacts
    files = files.concat(
      path.join(helpers.appDir, 'core/config', target.name + '.json'),
      path.join('.preflight', target.path),
      target.path);

    var clean = helpers.utid('clean');
    grunt.config(clean.property, files);
    grunt.log.writeflags(files, 'deleting files');

    if (dry) {
      grunt.log.writeln('Stopping before deleting files as requested.'.yellow);
      return grunt.log.ok();
    }

    // Then we need to update some of the clients tasks... and since there is
    // no other way to do it yet, I'm just updating the whole lot again.
    // It is fine to do this here before running the task, because the config
    // file is updated by helpers.deleteTarget, which means that it will be
    // updated by the time when updateTasks runs.
    grunt.util._.each(clients, updateTasks);

    var tasks = [
      clean.task,
      'carnaby:update-config',
    ].concat(
      helpers.runAllClients('extend', null, true),
      helpers.run('update-index')
    );
    grunt.task.run(tasks);
    grunt.log.ok();
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
    grunt.log.ok();
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

    // Create symlinks for common code shared by all clients

    // mkdirs to host symlinks to shared files
    if (!grunt.file.exists('.carnaby/common-symlinks')) {
      grunt.file.mkdir('.carnaby/common-symlinks');
    }
    if (!grunt.file.exists('.carnaby/vendor-symlinks')) {
      grunt.file.mkdir('.carnaby/vendor-symlinks');
    }

    var commonln_src = path.resolve('.', helpers.appDir, 'core');
    var commonln_dest = path.resolve('.', '.carnaby/common-symlinks', client.name);
    var vendorln_src = path.resolve('.', helpers.vendorDir);
    var vendorln_dest = path.resolve('.', '.carnaby/vendor-symlinks', client.name);

    if (!grunt.file.exists(commonln_dest)) {
      fs.symlinkSync(commonln_src, commonln_dest);
    }
    if (!grunt.file.exists(vendorln_dest)) {
      fs.symlinkSync(vendorln_src, vendorln_dest);
    }

    var clientTasks = [].concat(
      'carnaby:update-config',
      [
        'copy',
        'handlebars',
        'extend',
        'compass'
      ].map(function (task) {
        return task + ':' + client.name;
      }),
      'carnaby:write-main:' + client.name + ':' + target.name
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
    var project = helpers.readProject();
    var tasks = project.tasks;
    var clients = project.clients;

    // Iterate over tasks first
    grunt.util._.each(tasks, function (clients, task) {
      grunt.verbose.writeflags(clients, task);
      grunt.util._.each(clients, function (config, client) {
        var target = task + '.' + client;
        grunt.verbose.writeflags(config, client);
        grunt.config(target, config);
        grunt.verbose.writeflags(grunt.config(target), target);
      });
    });

    // Then iterate over clients and add the remaining task specific bits
    grunt.util._.each(clients, function (client) {
      // manually set the handlebars options for each client, b/c
      // handlebars options are generated with a function, which can't be
      // saved in the project.json file
      var property = ['handlebars', client.name, 'options'].join('.');
      grunt.config(property, handlebarsOptions());
    });
    grunt.log.ok();
  });

  /*
   * carnaby:update-index updates the project index
   */
  grunt.registerTask('carnaby:update-index', function () {
    var project = helpers.readProject();
    processTemplate({
      filepath: 'index.html',
      template: 'projectindex',
      force: true,
      context: {
        clients: project.clients,
        targets: project.targets
      }
    });
    grunt.log.ok();
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
    var configpath = path.join('.carnaby/tmp', client.name, 'config', target.name + '.json');
    var destpath = path.join(client.name, 'scripts/main.js');
    var config = grunt.file.read(configpath);
    var options = {
      filepath: destpath,
      template: 'main',
      force: true,
      context: {
        config: config
      },
      base: target.path
    };

    processTemplate(options);

    // if the target is the default target, we assume the user is a front end
    // dev working on her local copy of the project, and we spit out another
    // copy of main.js in the connect's artifacts directory for convenience
    if (target.name === helpers.defaulttargetname) {
      options.base = '.carnaby/tmp';
      processTemplate(options);
    }

    grunt.log.ok();
  });

  /*
   * carnaby:template carnaby template task
   */
  grunt.registerTask('carnaby:template', function() {
    var options = getTemplateOptions(this);
    processTemplate(options);
    grunt.log.ok();
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
    grunt.log.ok();
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

    // Create the actual client entry in the project and all the client
    // files derived from templates.
    var client = helpers.createClient(name, desc, force);
    var templates = makeTemplateOptionsList([
        // [template, destination] destination relative to base path (added later)
        ['app', 'scripts/app.js'],
        ['index', 'index.html'],
        ['hbssidebar', 'templates/sidebar.hbs'],
        ['hbsclient', 'templates/content.hbs'],
        ['clientstylesheet', 'styles/main.scss'],
        ['blankstylesheet', 'styles/_variables.scss'],
        ['blankstylesheet', 'styles/_mixins.scss'],
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

    // Once the client files are ready, add a blank configuration file
    // for each target.
    grunt.util._.each(helpers.readProject().targets, function (target) {
      processTemplate({
        context: {target: target.name},
        template: 'requiretarget',
        filepath: path.join(client.name, 'config', target.name + '.json'),
        force: force
      });
    });

    // Write all the tasks needed for this client to the project file
    // this bit actually writes tasks to the project file. maybe it should be
    // handled in a separate file, specialised to write tasks and update
    // `grunt.config()`
    updateTasks(client);

    // Update all artifacts for this client
    grunt.task.run(helpers.checkForce([
      helpers.run('update-client', name),
      helpers.run('update-index')
    ], force));
    grunt.log.ok();
  });

  /*
   * carnaby:new-project
   */
  grunt.registerTask('carnaby:new-project', function () {
    var force = this.flags.force;

    // Create the actual project and all the project files
    // derived from templates.
    var project = helpers.createProject(force);
    var templates = makeTemplateOptionsList([
        // [template, destination] destination relative to base path
        ['mainapp', 'common/scripts/app.js'],
        ['appcontroller', 'common/scripts/controllers/app-controller.js'],
        ['handlebars-loader', 'common/scripts/helpers/handlebars-loader.js'],
        ['hbssidebar', 'templates/sidebar.hbs'],
        ['commonstylesheet', 'common/styles/_common-styles.scss'],
        ['blankstylesheet', 'common/styles/_common-variables.scss'],
        ['blankstylesheet', 'common/styles/_common-mixins.scss'],
        ['requirebase', 'config/base.json'],
        ['requiretarget', 'config/local.json']
      ],
      // base path (relative to helpers.appDir)
      'core',
      // options
      {
        force: force
      }
    );
    grunt.util._.each(templates, processTemplate);

    // Run all other tasks that depend on a well defined project
    // to work properly.
    var cherryPick = [
      'carnaby:vendor-cherry-pick:html5-boilerplate',
      'apple*',
      'favicon.ico',
      'humans.txt',
      'robots.txt',
      'css/normalize.css',
      'css/main.css'
    ].join(':');

    var copyreset = helpers.utid('copy');
    var cleancss = helpers.utid('clean');
    var cssdir = path.join(helpers.appDir, 'core/css');
    var stylesdir = path.join(helpers.appDir, 'core/common/styles');
    grunt.config(copyreset.property, {
      files: [{
        src: path.join(cssdir, 'normalize.css'),
        dest: path.join(stylesdir, '_normalize.scss')
      }, {
        src: path.join(cssdir, 'main.css'),
        dest: path.join(stylesdir, '_base.scss')
      }]
    });

    grunt.config(cleancss.property, [ cssdir ]);

    grunt.task.run(helpers.checkForce([
      cherryPick,
      copyreset.task,
      cleancss.task,
      helpers.run('new-client'),
    ], force));

    grunt.log.ok();
  });

  /*
   * carnaby:build[:client][:target] Builds one client for one target
   *  defaults to carnaby:build:mobile:local
   */
  grunt.registerTask('carnaby:build', function () {

    //----------------------------------
    //
    // setup
    //
    //----------------------------------

    var args = helpers.removeFlags(this.args);
    var appdir = helpers.appDir;
    var vendordir = helpers.vendorDir;
    var bowerdir = helpers.bowerDir;
    var client = args.shift() || helpers.defaultclientname;
    var target = args.shift() || helpers.defaulttargetname;
    client = helpers.readClient(client);
    target = helpers.readTarget(target);

    // Drop a description of the target in the build dir, just in case someone
    // is left wondering wtf is a random dir doing in the middle of the
    // Concrete5 files.
    grunt.file.write(
      path.join(target.path, 'target.json'),
      JSON.stringify(target, null, 4)
    );

    //----------------------------------
    //
    // clean
    //
    //----------------------------------

    var clean = helpers.utid('clean');
    grunt.config(clean.property, [
      path.join('.preflight', target.path, client.name),
      path.join(target.path, client.name),
    ]);

    //----------------------------------
    //
    // copy
    //
    //----------------------------------

    var copyfiles = helpers.utid('copy');
    grunt.config(copyfiles.property, {
      files: [

        //----------------------------------
        //
        // first 2 copy sets should be a
        // separated task, like:
        // carnaby:preflight:target
        //
        //----------------------------------

        //----------------------------------
        //
        // app/core/common > .preflight/target/client/common
        //
        //----------------------------------
        {
          expand: true,
          cwd: path.join(appdir, 'core/common'),
          dest: path.join('.preflight', target.path, client.name, 'common'),
          src: [ 'scripts/**/*' ]
        },

        //----------------------------------
        //
        // vendor > .preflight/target/client
        //
        //----------------------------------
        {
          expand: true,
          cwd: vendordir,
          dest: path.join('.preflight', target.path, client.name),
          src: [ '**/*.js'],
          filter: 'isFile'
        },

        //----------------------------------
        //
        // app/client/scripts > .preflight/target/client
        //
        //----------------------------------
        {
          expand: true,
          cwd: path.join(appdir, client.name, 'scripts'),
          dest: path.join('.preflight', target.path, client.name, 'scripts'),
          src: [ '**/*' ]
        },

        //----------------------------------
        //
        // app/core > target/client
        //
        //----------------------------------
        {
          expand: true,
          cwd: path.join(appdir, 'core'),
          dest: path.join(target.path, client.name),
          src: [ '*' ],
          filter: 'isFile'
        },

        //----------------------------------
        //
        // .carnaby/tmp/client/scripts > to .preflight/target/client/scripts
        //
        //----------------------------------
        {
          expand: true,
          cwd: path.join('.carnaby/tmp', client.name, 'scripts'),
          dest: path.join('.preflight', target.path, client.name, 'scripts'),
          src: [ 'templates.js ']
        },

        //----------------------------------
        //
        // target/client/scrpts > .preflight/target/client/scripts
        //
        //----------------------------------
        {
          expand: true,
          cwd: path.join(target.path, client.name, 'scripts'),
          dest: path.join('.preflight', target.path, client.name, 'scripts'),
          src: ['main.js']
        },

        //----------------------------------
        //
        // .carnaby/tmp/client > to target/client
        //
        //----------------------------------
        {
          expand: true,
          cwd: path.join('.carnaby/tmp', client.name),
          dest: path.join(target.path, client.name),
          src: [ 'styles/**/*.css' ]
        },

        //----------------------------------
        //
        // app/client/ > target/client
        //
        //----------------------------------
        {
          expand: true,
          cwd: path.join(appdir, client.name),
          dest: path.join(target.path, client.name),
          src: [ '*' ],
          filter: 'isFile'
        },

        //----------------------------------
        //
        // loose ends: plugins.js, handlebars.js, require.js
        //
        //----------------------------------
        {
          expand: true,
          cwd: bowerdir,
          dest: path.join(target.path, client.name, 'bower_components'),
          src: [
            'html5-boilerplate/js/plugins.js',
            'handlebars/handlebars.js',
            'requirejs/require.js'
          ]
        },
      ]
    });

    //----------------------------------
    //
    // requirejs
    //
    //----------------------------------

    var requirejs = helpers.utid('requirejs');
    grunt.config(requirejs.property, {
      options: {
        baseUrl: path.join('.preflight', target.path, client.name, 'scripts'),
        mainConfigFile: path.join('.preflight', target.path, client.name, 'scripts/main.js'),
        dir: path.join(target.path, client.name, 'scripts'),
        optimize: 'none',
        useStrict: true,
        wrap: true
      }
    });

    grunt.task.run([
      clean.task,
      helpers.run('update-client', client.name, target.name),
      copyfiles.task,
      requirejs.task
    ]);

    grunt.log.ok();
  });

  /*
   * carnaby:build:all Builds all clients for all targets
   */
  grunt.registerTask('carnaby:build:all', function () {
    var all = helpers.runAll('build');
    grunt.task.run(all);
    grunt.log.ok();
  });

  /*
   * carnaby:update-client:all[:target] updates all clients
   * defaults to carnaby:all:local
   */
  grunt.registerTask('carnaby:update-client:all', function () {
    var args = helpers.removeFlags(this.args);
    var target = args.shift();
    var all;
    if (target) {
      target = helpers.readTarget(target).name;
      all = helpers.runAllClients('update-client', target);
    } else {
      all = helpers.runAll('update-client');
    }
    grunt.task.run(all);
    grunt.log.ok();
  });

  /*
   * carnaby:clean-target[:target] cleans all the artifacts for a target, including
   * preflight files. Leaves the target dir in place to allow GitHub style
   * deployments (keeping .git in place)
   * defaults to carnaby:clean-target:local
   */
  grunt.registerTask('carnaby:clean-target', function () {
    var args = helpers.removeFlags(this.args);
    var target = helpers.readTarget(args.shift() || helpers.defaulttargetname);
    var clean = helpers.utid('clean');
    grunt.config(clean.property, [
      path.join('.preflight', target.path),
      path.join(target.path, '**/*')
    ]);
    grunt.task.run(clean.task);
    grunt.log.ok();
  });

  /*
   * carnaby:clean-client[:client] cleans all the artifacts for a client
   * defaults to carnaby:clean-client:mobile
   */
  grunt.registerTask('carnaby:clean-client', function () {
    var args = helpers.removeFlags(this.args);
    var client = helpers.readClient(args.shift() || helpers.defaultclientname);
    var clean = helpers.utid('clean');
    grunt.config(clean.property, [
      path.join('.carnaby/tmp', client.name),
      path.join('.carnaby/*-symlinks', client.name)
    ]);
    grunt.task.run(clean.task);
    grunt.log.ok();
  });

  /*
   * carnaby:clean cleans all artifacts
   */
  grunt.registerTask('carnaby:clean', function () {
    var clients = helpers.runAllClients('clean-client');
    var targets = helpers.runAllTargets('clean-target');
    grunt.task.run([].concat(clients, targets));
    grunt.log.ok();
  });

  /*
   * carnaby:update-tasks[:client] updates the tasks for a client
   *  defaults to carnaby:update-tasks:mobile
   */
  grunt.registerTask('carnaby:update-tasks', function () {
    var args = helpers.removeFlags(this.args);
    var client = helpers.readClient(args.shift() || helpers.defaultclientname);
    updateTasks(client);
  });

  /*
   * carnaby:update-tasks:all updates the tasks for all clients
   */
  grunt.registerTask('carnaby:udpate-tasks:all', function () {
    grunt.task.run(helpers.runAllClients('update-tasks'));
  });

};
