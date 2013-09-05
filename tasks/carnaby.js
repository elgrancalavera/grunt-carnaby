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

  // tasks that we need to run every time we update a client.
  var updateClientTasks = [
    'copy',
    'handlebars',
    'extend',
    'compass',
    'carnaby:write-symlinks'
  ];

  // [template, destination] destination relative to base path (added later)

  var commonTemplates = [
    ['mainapp', 'scripts/common/app.js'],
    ['appcontroller', 'scripts/common/controllers/app-controller.js'],
    ['requirebase', 'config/base.json'],
    ['requireconfdev', 'config/dev.json'],
    ['requireconfqa', 'config/qa.json'],
    ['requireconfprod', 'config/prod.json'],
    ['requireconflocal', 'config/local.json'],
    ['hbs', 'templates/main-view.hbs'],
    ['extensions', 'scripts/common/helpers/extensions.js'],
    ['handlebars-loader', 'scripts/common/helpers/handlebars-loader.js']
  ];

  var clientTemplates = [
    ['app', 'scripts/app.js'],
    ['requireconf', 'config/base.json'],
    ['requireconfdev', 'config/dev.json'],
    ['requireconfqa', 'config/qa.json'],
    ['requireconfprod', 'config/prod.json'],
    ['requireconflocal', 'config/local.json'],
    ['index', 'index.html'],
    ['hbs', 'templates/client-main-view.hbs']
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
    var templates = makeTemplateOptionsList(commonTemplates, 'common', options);
    processMultipleTemplates(templates);
  };

  var makeClient = function (name, description, force) {
    var client = helpers.createClient(name, description, force).readClient(name);
    var options = {
      force: force,
      client: client,
      context: {
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
      '<%= carnaby.appDir %>/common/config/base.json',
      '<%= carnaby.appDir %>/common/config/local.json',
      path.join('<%= carnaby.appDir %>', client.name, 'config/base.json'),
      path.join('<%= carnaby.appDir %>', client.name, 'config/local.json')
    ];

    files[path.join(dest, 'dev.json')] = [
      '<%= carnaby.appDir %>/common/config/base.json',
      '<%= carnaby.appDir %>/common/config/dev.json',
      path.join('<%= carnaby.appDir %>', client.name, 'config/base.json'),
      path.join('<%= carnaby.appDir %>', client.name, 'config/dev.json')
    ];

    files[path.join(dest, 'qa.json')] = [
      '<%= carnaby.appDir %>/common/config/base.json',
      '<%= carnaby.appDir %>/common/config/qa.json',
      path.join('<%= carnaby.appDir %>', client.name, 'config/base.json'),
      path.join('<%= carnaby.appDir %>', client.name, 'config/qa.json')
    ];

    files[path.join(dest, 'prod.json')] = [
      '<%= carnaby.appDir %>/common/config/base.json',
      '<%= carnaby.appDir %>/common/config/prod.json',
      path.join('<%= carnaby.appDir %>', client.name, 'config/base.json'),
      path.join('<%= carnaby.appDir %>', client.name, 'config/prod.json')
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

    var srcbase = path.join('<% carnaby.appDir %>/', client.name);
    var dstbase = path.join('.carnaby/tmp', client.name);
    helpers.ensureTask(project, 'compass');
    project.tasks.compass[client.name] = {
      sassDir: path.join(srcbase, 'styles'),
      cssDir: path.join(dstbase, 'styles'),
      imagesDir: path.join(srcbase, 'images'),
      fontsDir: path.join(srcbase, 'styles/fonts'),
      javascriptsDir: path.join(srcbase, 'scripts'),
      importPath: '',
      relativeAssets: true
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
      'carnaby:write-main:' + client.name + ':' + target
    );
    grunt.verbose.writeflags(clientTasks, 'client tasks');
    grunt.task.run(clientTasks);
  });

  /*
   * carnaby:write-symlinks[:client] writes symlinks for common code in each client
   */
  grunt.registerTask('carnaby:write-symlinks', function () {
    var args = helpers.removeFlags(this.args);
    var client = helpers.readClient(args[0]);
    var src = path.resolve(helpers.appDir, 'common/scripts/common');
    var dst = path.resolve('.carnaby/tmp', client.name, 'scripts/common');
    var parent = path.dirname(dst);
    if (!grunt.file.exists(parent)) {
      grunt.log.writeln((parent + ' directory does not exist. Creating it.').yellow);
      grunt.file.mkdir(parent);
    }
    grunt.log.debug('src:', src);
    grunt.log.debug('dst:', dst);
    fs.symlinkSync(src, dst);
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
        grunt.verbose.writeflags(config, client);
        grunt.config(task + '.' + client, config);
      });
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
    makeCommon(force);
    grunt.task.run(helpers.checkForce(['carnaby:new-client'], force));
  });
};
