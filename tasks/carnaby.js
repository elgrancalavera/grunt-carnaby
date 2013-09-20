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
var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});

module.exports = function(grunt) {
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
    files.push(target.path);

    grunt.log.writeflags(files, 'deleting files');

    if (dry) {
      return grunt.log.writeln('Stopping before deleting files are requested.'.yellow);
    }

    var cleantarget = helpers.utid('clean');
    grunt.config(cleantarget.property, files);
    grunt.log.writeflags(grunt.config('clean'), 'clean');
    grunt.task.run(cleantarget.task);

    // then we need to update some of the clients tasks... and since there is
    // no other way to do it yet, I'm just updating the whole lot again.
    grunt.util._.each(clients, updateTasks);
    grunt.task.run(['carnaby:update-config', 'extend']);

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
      'carnaby:write-main:' + client.name + ':' + target.name,
      'carnaby:update-index'
    );
    grunt.log.writeflags(clientTasks);
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
      // saved in the projec.json file
      var property = ['handlebars', client.name, 'options'].join('.');
      grunt.config(property, handlebarsOptions());
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
    var options = {
      filepath: path.join(client.name, 'scripts/main.js'),
      template: 'main',
      force: true,
      context: {
        config: grunt.file.read(path.join('.carnaby/tmp', client.name, 'config', target.name + '.json'))
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
    updateTasks(client);

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
        ['hbssidebar', 'templates/sidebar.hbs'],
        ['commonstylesheet', 'common/styles/_common-styles.scss'],
        ['blankstylesheet', 'common/styles/_common-variables.scss'],
        ['blankstylesheet', 'common/styles/_common-mixins.scss'],
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
      'carnaby:new-client',
    ], force));

  });

  /*
   * grunt:carnaby:build[:client][:target] Builds one client for one target
   *  defaults to grunt:carnaby:build:mobile:local
   */
  grunt.registerTask('carnaby:build', function () {
    var args = helpers.removeFlags(this.args);
    var client = args.shift() || helpers.defaultclientname;
    var target = args.shift() || helpers.defaulttargetname;
    client = helpers.readClient(client);
    target = helpers.readTarget(target);
    grunt.verbose.writeflags(client, 'client');
    grunt.verbose.writeflags(target, 'target');

    //----------------------------------
    //
    // paths
    //
    //----------------------------------

    var appdir = helpers.appDir;

    // destinations
    var dest_target = target.path;
    var dest_client = path.join(dest_target, client.name);
    var dest_client_scripts = path.join(dest_client, 'scripts');
    var dest_preflight = path.join('.preflight', dest_target);
    var dest_preflitght_client = path.join('.preflight', dest_client);
    var dest_preflight_core_scripts = path.join(dest_preflight, 'common/scripts');
    var dest_preflight_client_scripts = path.join(dest_preflitght_client, 'scripts');
    var dest_bower = path.join(dest_client, 'bower_components');

    // sources
    var src_core = path.join(appdir, 'core');
    var src_client = path.join(appdir, client.name);
    var src_client_generated = path.join('.carnaby/tmp', client.name);
    var src_client_generated_scripts = path.join(src_client_generated, 'scripts');
    var src_core_scripts = path.join(src_core, 'common/scripts');
    var src_client_scripts = path.join(src_client, 'scripts');
    var src_vendor = helpers.vendorDir;
    var src_bower = path.join(src_vendor, 'bower_components');
    var src_mainjs = path.join(src_client_generated, 'scripts/main.js');

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
      dest_preflitght_client,
      dest_client
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
        // 1. Everything that isn't a script
        //
        //----------------------------------
        {
          expand: true,
          cwd: src_client_generated,
          dest: dest_client,
          src: [
            'styles/**/*',
          ]
        },
        {
          expand: true,
          cwd: src_client_generated,
          dest: dest_client,
          src: [ '*' ],
          filter: 'isFile'
        },
        {
          expand: true,
          cwd: src_core,
          dest: dest_client,
          src: [ '*' ],
          filter: 'isFile'
        },
        {
          expand: true,
          cwd: src_client,
          dest: dest_client,
          src: [ '*' ],
          filter: 'isFile'
        },

        //----------------------------------
        //
        // 2. Scripts to preflight location
        //
        //----------------------------------
        {
          expand: true,
          cwd: src_core_scripts,
          dest: dest_preflight_core_scripts,
          src: [ '**/*.js' ]
        },
        {
          expand: true,
          cwd: src_vendor,
          dest: dest_preflight,
          src: [ '**/*.js']
        },
        {
          expand: true,
          cwd: src_client_scripts,
          dest: dest_preflight_client_scripts,
          src: [ '**/*.js' ]
        },
        {
          expand: true,
          cwd: src_client_generated_scripts,
          dest: dest_preflight_client_scripts,
          src: ['**/*.js']
        },

        //----------------------------------
        //
        // 3. loose ends: plugins.js
        //    handlebars.js, require.js
        //
        //----------------------------------
        {
          expand: true,
          cwd: src_bower,
          dest: dest_bower,
          src: [
            'html5-boilerplate/js/plugins.js',
            'handlebars/handlebars.js',
            'requirejs/require.js'
          ]
        }
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
        baseUrl: dest_preflight_client_scripts,
        dir: dest_client_scripts,
        mainConfigFile: src_mainjs,
        optimize: 'none',
        useStrict: true,
        wrap: true
      }
    });

    grunt.task.run([
      clean.task,
      helpers.run('update-client', client.name, target.name),
      helpers.run('write-main', client.name, target.name),
      copyfiles.task,
      requirejs.task,
    ]);

  });

  /*
   * grunt:carnaby:build:all Builds all clients for all targets
   */
  grunt.registerTask('carnaby:build:all', function () {
    var project = helpers.readProject();
    var clients = Object.keys(project.clients);
    var targets = Object.keys(project.targets);

    // The carthesian product of clients X targets gives you a list of
    // [ [ client, target ] ] which you can then use to build each client
    // for each target.
    var all = clients.reduce(function (args, client) {
      return args.concat(targets.map(function (target) {
        return helpers.run('build', client, target);
      }));
    }, []);
    grunt.verbose.writeflags(all, 'each client each target');
    grunt.task.run(all);
  });

  /*
   * grunt:carnaby:update-client:all[:target] updates all clients
   * defaults to grunt:carnaby:all:local
   */
  grunt.registerTask('carnaby:update-client:all', function () {
    var args = helpers.removeFlags(this.args);
    var clients = Object.keys(helpers.readProject().clients);
    var target = args.shift() || helpers.defaulttargetname;
    target = helpers.readTarget(target);
    var all = clients.map(function (client) {
      return helpers.run('update-client', client, target.name);
    });
    grunt.task.run(all);
  });

};
