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

module.exports = function(grunt) {
  var helpers = require('./lib/helpers').init(grunt);
  var hbsOptions = require('./lib/handlebars-options').init(grunt);

  // [template, destination] destination relative to base path (added later)

  var commonTemplates = [
    ['mainapp', 'scripts/common/app.js'],
    ['appcontroller', 'scripts/common/controllers/app-controller.js'],
    ['requirebase', 'config/base.json'],
    ['requireconf', 'config/dev.json'],
    ['requireconf', 'config/qa.json'],
    ['requireconf', 'config/prod.json'],
    ['requireconf', 'config/local.json'],
    ['hbs', 'templates/main-view.hbs']
  ];

  var clientTemplates = [
    ['app', 'scripts/app.js'],
    ['requireconf', 'config/base.json'],
    ['requireconf', 'config/dev.json'],
    ['requireconf', 'config/qa.json'],
    ['requireconf', 'config/prod.json'],
    ['requireconf', 'config/local.json'],
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
    var dest, files;

    //----------------------------------
    //
    // copy:templates
    //
    //----------------------------------

    dest = path.join('.carnaby/tmp', client.name, 'templates');
    helpers.ensureTask(project, 'copy');
    project.tasks.copy[client.name + '_templates'] = {
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

    // local
    // dev
    // qa
    // prod

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
    // Save and forget
    //
    //----------------------------------

    helpers.saveProject(project);

    // temp
    grunt.config('copy', project.tasks.copy);
    grunt.config('handlebars.options', hbsOptions());
    grunt.config('handlebars.' + client.name, project.tasks.handlebars[client.name]);
    grunt.config('extend', project.tasks.extend);

    grunt.task.run('copy');
    grunt.task.run('handlebars');
    grunt.task.run('extend');

  };

  var makeClientSymlinks = function (client) {
    // from app/common/scripts/common
    // to .carnaby/mount/{client.name}/scripts/common
  };

  var makeClientMain = function (client) {
    // extending {}
    // with app/commom/scripts/common/config.json
    // with app/{client.name}/config.json
    // to .carnaby/mount/{client.name}/config.json
  };

  // this needs to be a grun task that iterates over the clients and writes
  // the main file for each one of them.
  var writeClientMain = function (client) {
    // readJSON .carnaby/mount/{client.name}/config.json
    // use as context
    // grunt carnaby:template:main:.carnaby/mount/{client.name}/scripts/main.js
  };

  var processTemplate = function (options) {

    grunt.log.debug('Processing template');
    grunt.log.debug(options.template);
    grunt.log.debug(options.filepath);

    var before = options.before || grunt.util._.identity;
    var appDir = helpers.appDir;
    var dest = path.join(appDir, options.filepath);
    helpers.checkFile(dest, options.force);

    var extname = path.extname(options.filepath);
    var filename = path.basename(options.filepath);
    var filenamenoext = path.basename(options.filepath, extname);
    var dirname = path.dirname(options.filepath);
    var filepathnoext = path.join(dirname, filenamenoext);
    var template = before(helpers.getTemplate(options.template));

    var context = grunt.util._.extend(helpers.readPackage(), options.context || {}, {
      filename: filename,
      extname: extname,
      dirname: dirname,
      filepath: options.filepath,
      filenamenoext: filenamenoext,
      filepathnoext: filepathnoext
    });

    grunt.verbose.writeflags(options, 'Options');
    grunt.verbose.writeflags(context, 'Context');
    grunt.log.debug(template);
    grunt.log.debug(dest);

    grunt.file.write(dest, grunt.template.process(template, { data: context }));
    grunt.log.ok('File "' + dest + '" written.');
  };

  var processMultipleTemplates = function (optionsList) {
    grunt.util._.each(optionsList, function (options) {
      processTemplate(options);
    });
  };

  var basepath = function () {
    var pathcomponents = [helpers.appDir];
    pathcomponents = pathcomponents.concat(grunt.util.toArray(arguments));
    return path.join.apply(null, pathcomponents);
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
   * carnaby:template carnaby template task
   */
  grunt.registerTask('carnaby:template', 'Writes a file from a template.', function() {
    var options = getTemplateOptions(this);
    processTemplate(options);
  });

  /*
   * carnaby:init-template carnaby template for grunt-init-carnaby
   *  ti templates don't replace any template tokens, just change their syntax
   *  and leaves them in place to be used developing grunt-init-carnaby
   */
  grunt.registerTask('carnaby:init-template', 'Writes a file for grunt-init-carnaby from a template', function () {
    var options = getTemplateOptions(this);
    options.before = function (template) {
      return template.replace(/<%/g, '{%').replace(/%>/g, '%}');
    };
    processTemplate.call(this, options);
  });

  /*
   * carnaby:client generates a carnaby client application
   */
  grunt.registerTask('carnaby:client', 'Generates a carnaby client application', function () {
    var name = this.args[0];
    var desc = this.args[1];
    var force = this.flags.force;
    makeClient(name, desc, force);
  });

  /*
   * carnaby
   */
  grunt.registerTask('carnaby', 'carnaby project generation and installation', function () {
    var force = this.flags.force;
    makeCommon(force);
    makeClient(helpers.defaultclientname, 'Carnaby\'s default mobile client.', force);
  });
};
