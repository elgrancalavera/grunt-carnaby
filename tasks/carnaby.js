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
  var _ = grunt.util._;

  var mountFolder = function (connect, dir) {
    return connect.static(path.resolve(dir));
  };

  var makeTemplateOptionsList = function (templatelist, basepath, options) {
    grunt.log.writeflags(templatelist);
    grunt.log.writeln(basepath);
    grunt.log.writeflags(options);
    return _.map(templatelist, function (args) {
      return _.extend({
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

    dest = path.join(helpers.tmpDir, client.name, 'templates');
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

    dest = path.join(helpers.tmpDir, client.name, 'scripts/templates.js');
    files = {};
    files[dest] = [path.join(helpers.tmpDir, client.name, 'templates/**/*.hbs')];
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
    dest = path.join(helpers.tmpDir, client.name, 'config');

    files[path.join(dest, 'local.json')] = [
      '<%= carnaby.appDir %>/core/config/base.json',
      '<%= carnaby.appDir %>/core/config/local.json',
      path.join('<%= carnaby.appDir %>', client.name, 'config/base.json'),
      path.join('<%= carnaby.appDir %>', client.name, 'config/local.json')
    ];

    // then for each target ...
    var targets = helpers.readProject().targets;
    _.each(targets, function (target, targetName) {
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
    var dstbase = path.join(helpers.tmpDir, client.name);
    var commonbase = path.join('<%= carnaby.appDir %>', 'core/common/styles');

    helpers.ensureTask(project, 'compass');
    project.tasks.compass[client.name] = {
      options: {
        basePath: srcbase,
        sassDir: 'styles',
        cssDir: 'css',
        imagesDir: 'images',
        generatedImagesDir: 'images/generated',
        fontsDir: 'fonts',
        javascriptsDir: 'scripts',
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

    var before = options.before || _.identity;
    var base = options.base || helpers.appDir;
    var dest = path.join(base, options.filepath);
    var extname = path.extname(options.filepath);
    var filename = path.basename(options.filepath);
    var filenamenoext = path.basename(options.filepath, extname);
    var dirname = path.dirname(options.filepath);
    var filepathnoext = path.join(dirname, filenamenoext);
    var template = before(helpers.readTemplate(options.template));

    var context = _.extend(options.context || {}, {
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
      filepath: path.normalize(_.last(args)),
      template: _.first(args),
      force: task.flags.force
    };
    return options;
  };

  //--------------------------------------------------------------------------
  //
  // Tasks
  //
  //--------------------------------------------------------------------------

  var taskdesc = '';
  var td = function () {
    var args = _.toArray(arguments);
    args.push('-------------------------------');
    args.push(' :required [:optional] (:flag)');
    args.push('-------------------------------');
    args.push('');
    return helpers.argsToStringMaker('\n').apply(null, args);
  };

  //----------------------------------
  //
  // carnaby:ls
  //
  //----------------------------------
  grunt.registerTask('carnaby:ls', td(

    '[:property] Lists properties in ".carnaby/project.json". Defaults to list all the project\'s properties.'

    ), function () {
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

  //----------------------------------
  //
  // carnaby:new-target
  //
  //----------------------------------
  grunt.registerTask('carnaby:new-target', td(

    ':name:path[:description] Generates a deployment target. ',
    ':path is relative to <% carnaby.targetDir %>.'

    ), function () {
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

    // change this to use _.keys(clients) instead...
    var clients = helpers.readProject().clients;
    var templateList = [['requiretarget', path.join('config', name + '.json')]];
    var templateOptions = {
      context: { target: name },
      force: force
    };
    var coreTemplates = makeTemplateOptionsList(templateList, 'core', templateOptions);
    var templates = _.reduce(clients, function (templates, client, key) {
      return templates.concat(makeTemplateOptionsList(templateList, key, templateOptions));
    }, coreTemplates);

    _.each(templates, processTemplate);
    grunt.verbose.writeflags(target, 'new target created');

    // then we need to update some of the clients tasks... and since there is
    // no other way to do it yet, I'm just updating the whole lot again.
    _.each(clients, updateTasks);
    var tasks = [
      helpers.run('update-config')
    ].concat(
      helpers.runAllClients('extend', null, true),
      helpers.run('update-index')
    );
    grunt.task.run(tasks);
    grunt.log.ok();
  });


  //----------------------------------
  //
  // carnaby:delete-target
  //
  //----------------------------------
  grunt.registerTask('carnaby:delete-target', td(

  ':name(:dry-run) Deletes an existing deployment target.',
  ':dry-run Outputs the results of this operation without actually deleting anything.'

    ), function () {
    var args = helpers.removeFlags(this.args);
    var dry = this.flags['dry-run'];
    var name = args.shift();
    var target = helpers.deleteTarget(name, dry);
    var clients = helpers.readProject().clients;

    // each config from each client
    var files = _.map(clients, function (client) {
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
    _.each(clients, updateTasks);

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

  //----------------------------------
  //
  // carnaby:vendor-cherry-pick
  //
  //----------------------------------
  grunt.registerTask('carnaby:vendor-cherry-pick', td(

    ':vendor:file[:file_n](:force) Cherry picks vendor files from',
    '"<%= carnaby.bowerDir %>" and copies them to',
    '"<%= carnaby.appDir %>/core/common", which is kept under version control. This is intended to provide an easy way to incorporate third party code into the project.'

    ), function () {
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

  //----------------------------------
  //
  // carnaby:udpate-client
  //
  //----------------------------------
  grunt.registerTask('carnaby:update-client', td(

    '[:client][:target] Updates a client\'s generated files for a given target. Defaults to ":mobile:local".'

    ), function () {
    var force = this.flags.force;
    var args = helpers.removeFlags(this.args);
    var client = args.shift();
    var target = args.shift();
    client = helpers.readClient(client);
    target = helpers.readTarget(target);

    // Create symlinks for common code shared by all clients
    var slcommon = helpers.symlinksCommon;
    var slvendor = helpers.symlinksVendor;

    // mkdirs to host symlinks to shared files
    if (!grunt.file.exists(slcommon)) {
      grunt.file.mkdir(slcommon);
    }
    if (!grunt.file.exists(slvendor)) {
      grunt.file.mkdir(slvendor);
    }

    var commonln_src = path.resolve('.', helpers.appDir, 'core');
    var commonln_dest = path.resolve('.', slcommon, client.name);
    var vendorln_src = path.resolve('.', helpers.vendorDir);
    var vendorln_dest = path.resolve('.', slvendor, client.name);

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

  //----------------------------------
  //
  // caranby:update-client:all
  //
  //----------------------------------

  grunt.registerTask('carnaby:update-client:all', td(

    '[:target] Updates all clients for a given deployment target. Defaults to ":local".'

    ), function () {
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

  //----------------------------------
  //
  // carnaby:update-config
  //
  //----------------------------------
  grunt.registerTask('carnaby:update-config', td(

    'Updates "grunt.config()" with all the entries from ".carnaby/project.json"'

    ), function () {
    var project = helpers.readProject();
    var tasks = project.tasks;
    var clients = project.clients;

    // Iterate over tasks first
    _.each(tasks, function (clients, task) {
      grunt.verbose.writeflags(clients, task);
      _.each(clients, function (config, client) {
        var target = task + '.' + client;
        grunt.verbose.writeflags(config, client);
        grunt.config(target, config);
        grunt.verbose.writeflags(grunt.config(target), target);
      });
    });

    // Then iterate over clients and add the remaining task specific bits
    _.each(clients, function (client) {
      // manually set the handlebars options for each client, b/c
      // handlebars options are generated with a function, which can't be
      // saved in the project.json file
      var property = ['handlebars', client.name, 'options'].join('.');
      grunt.config(property, handlebarsOptions());
    });
    grunt.log.ok();
  });

  //----------------------------------
  //
  // carnaby:update-index
  //
  //----------------------------------
  grunt.registerTask('carnaby:update-index', td(

    'Updates "<%= carnaby.appDir %>/index.html".'

    ), function () {
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

  //----------------------------------
  //
  // carnaby:write-main
  //
  //----------------------------------
  grunt.registerTask('carnaby:write-main', td(

    '[:client][:target] Writes a client\'s main.js file for a given target. Defaults to ":mobile:local".'

    ), function () {
    this.requires(['carnaby:update-config']);
    var args = helpers.removeFlags(this.args);
    var client = args.shift() || helpers.defaultclientname;
    var target = args.shift() || helpers.defaulttargetname;
    client = helpers.readClient(client);
    target = helpers.readTarget(target);
    var configpath = path.join(helpers.tmpDir, client.name, 'config', target.name + '.json');
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
      options.base = helpers.tmpDir;
      processTemplate(options);
    }

    grunt.log.ok();
  });

  //----------------------------------
  //
  // carnaby:template
  //
  //----------------------------------
  grunt.registerTask('carnaby:template', td(
    ':name:path Writes a file with the specified carnaby template to ":path". ":path" is realtive to "<%= carnaby.appDir %>. ',
    '',
    'Most of these templates are used internally by carnaby to generate client and project files, and it makes little to no sense to use them directly in a project, but some of them can be useful, for instance "amd"',
    '',
    'Usage example:',
    '',
    'grunt carnaby:template:amd:mobile/scripts/sugar.js',
    '',
    'Will write the following file using the values from "package.json":',
    '',
    '/*',
    ' * grunt-carnaby',
    ' * mobile/scripts/sugar.js',
    ' * git://github.com/elgrancalavera/grunt-carnaby.git',
    ' * Copyright (c) 2013 M&C Saatchi',
    ' * mcsaatchi.com',
    ' */',
    'define(function (require, exports, module) {',
    '  \'use strict\';',
    '  return exports;',
    '});',

    '',
    'Available template names by category:',
    '',
    'JSON (.json)',
    '------------',
    'requirebase',
    'requiretarget',
    'project',
    '',
    'Handlebars (.hbs)',
    '-----------------',
    'hbs',
    'hbssidebar',
    'hbsclient',
    '',
    'JS (.js)',
    '--------',
    'def',
    'amd',
    'sugar',
    'mainapp',
    'app',
    'appcontroller',
    'main',
    'itemview',
    'handlebars-loader',
    '',
    'HTML (.html)',
    '------------',
    'html',
    'index',
    'projectindex',
    '',
    'SASS (.scss)',
    '------------',
    'commonstylesheet',
    'clientstylesheet',
    'blankstylesheet',
    ''
    ), function() {
    var options = getTemplateOptions(this);
    processTemplate(options);
    grunt.log.ok();
  });

  //----------------------------------
  //
  // carnaby:new-client
  //
  //----------------------------------
  grunt.registerTask('carnaby:new-client', td(

    '[:name][:description](:force) Generates a carnaby client application. Defaults to ":mobile".'

    ), function () {
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

    _.each(templates, processTemplate);

    // Once the client files are ready, add a blank configuration file
    // for each target.
    _.each(helpers.readProject().targets, function (target) {
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

    // Copy any files from the task directory to the client directory
    var copy = helpers.utid('copy');
    grunt.config(copy.property, {
      expand: true,
      cwd: path.join(__dirname, 'assets'),
      dest: client.root,
      src: [ 'images/**/*.{png,jpg,jpeg,gif}']
    });

    // Update all artifacts for this client
    grunt.task.run(helpers.checkForce([
      copy.task,
      helpers.run('update-client', name),
      helpers.run('update-index')
    ], force));
    grunt.log.ok();
  });

  //----------------------------------
  //
  // carnaby:delete-client
  //
  //----------------------------------

  grunt.registerTask('carnaby:delete-client', td(

    ':client(:dry-run) Deletes the specified client application.'

    ), function () {

    var args = helpers.removeFlags(this.args);
    var dry = this.flags['dry-run'];

    var clientName = args.shift();
    if (!clientName) {
      grunt.fatal('Please specify which client you want to delete.');
    }
    var client =  helpers.deleteClient(clientName, dry);
    var files = path.join(client.root, '**/*');
    grunt.log.writeflags(grunt.file.expand(files), 'deleting files');
    if (dry) {
      grunt.log.writeln('Stopping before deleting files as requested.'.yellow);
      return grunt.log.ok();
    }

    var cleanHelp = cleanHelper(client.name);
    var clean = helpers.utid('clean');
    grunt.config(clean.property, client.root);

    grunt.task.run([
      cleanHelp.task,
      clean.task,
    ]);

  });

  //----------------------------------
  //
  // carnaby:new-project
  //
  //----------------------------------
  grunt.registerTask('carnaby:new-project', td(

    '(:force) Generates a new carnaby project, including a default mobile client.'

    ), function () {
    var force = this.flags.force;

    // Create the actual project and all the project files
    // derived from templates.
    var project = helpers.createProject(force);
    var templates = makeTemplateOptionsList([
        // [template, destination] destination relative to base path
        ['mainapp', 'common/scripts/app.js'],
        ['amd', 'common/scripts/helpers/extensions.js'],
        ['appcontroller', 'common/scripts/controllers/app-controller.js'],
        ['handlebars-loader', 'common/scripts/helpers/handlebars-loader.js'],
        ['hbssidebar', 'templates/sidebar.hbs'],
        ['commonstylesheet', 'common/styles/_common.scss'],
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
    _.each(templates, processTemplate);

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
        dest: path.join(stylesdir, '_html5bp.scss')
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

  //----------------------------------
  //
  // carnaby:build
  //
  //----------------------------------
  grunt.registerTask('carnaby:build', td(

    '[:client][:target] Builds a client for a given deployment target. Defaults to ":mobile:local".'

    ), function () {

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
          cwd: path.join(helpers.tmpDir, client.name, 'scripts'),
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
        // app/client/ > target/client/
        //
        //----------------------------------
        {
          expand: true,
          cwd: path.join(appdir, client.name),
          dest: path.join(target.path, client.name),
          src: [ 'css/**/*.css', 'images/**/*.{jpg,png,gif,jpeg}' ]
        },

        //----------------------------------
        //
        // app/client/ > target/client (top level files)
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
        // loose ends: modernizr.js, plugins.js, handlebars.js, require.js
        //
        //----------------------------------
        {
          expand: true,
          cwd: bowerdir,
          dest: path.join(target.path, client.name, 'bower_components'),
          src: [
            'modernizr/modernizr.js',
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


  //----------------------------------
  //
  // carnaby:build:all
  //
  //----------------------------------
  grunt.registerTask('carnaby:build:all', td(

    'Builds all clients for all targets.'

    ), function () {
    var all = helpers.runAll('build');
    grunt.task.run(all);
    grunt.log.ok();
  });

  //----------------------------------
  //
  // carnaby:clean-target
  //
  //----------------------------------
  grunt.registerTask('carnaby:clean-target', td(

    '[:target] Cleans all artifacts for a build target. Leaves the target directory in place but deletes its contents, allowing GitHub Pages (http://pages.github.com) style deployments. Defaults to ":local".'

    ), function () {
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


  //----------------------------------
  //
  // carnaby:clean-client
  //
  //----------------------------------

  // because sometimes you want to clean a dead client.
  var cleanHelper = function (clientName) {
    var clean = helpers.utid('clean');
    grunt.config(clean.property, [
      path.join(helpers.tmpDir, clientName),
      path.join('<%= carnaby.symlinks.common %>', clientName),
      path.join('<%= carnaby.symlinks.vendor %>', clientName),
      path.join('<%= carnaby.targetDir %>/**/', clientName),
      path.join('.preflight/**', clientName),
    ]);

    return clean;
  };

  grunt.registerTask('carnaby:clean-client', td(

    '[:client] Cleans all the artifacts for a client. Defaults to ":mobile".'

    ), function () {
    var args = helpers.removeFlags(this.args);
    var client = helpers.readClient(args.shift() || helpers.defaultclientname);
    var clean = cleanHelper(client.name);
    grunt.task.run(clean.task);
    grunt.log.ok();
  });

  //----------------------------------
  //
  // carnaby:clean
  //
  //----------------------------------
  grunt.registerTask('carnaby:clean', td(

    'Cleans all artifacts for all clients and all targets.'

    ), function () {
    var clients = helpers.runAllClients('clean-client');
    var targets = helpers.runAllTargets('clean-target');
    grunt.task.run([].concat(clients, targets));
    grunt.log.ok();
  });

  //----------------------------------
  //
  // carnaby:update-tasks
  //
  //----------------------------------
  grunt.registerTask('carnaby:update-tasks', td(

    '[:client] Updates the tasks for a client. Defaults to ":mobile".'

    ), function () {
    var args = helpers.removeFlags(this.args);
    var client = helpers.readClient(args.shift() || helpers.defaultclientname);
    updateTasks(client);
  });

  //----------------------------------
  //
  // carnaby:uptate-tasks:all
  //
  //----------------------------------
  grunt.registerTask('carnaby:udpate-tasks:all', td(

    'Updates the tasks for all clients.'

    ), function () {
    grunt.task.run(helpers.runAllClients('update-tasks'));
  });

};
