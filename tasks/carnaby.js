/*
 * carnaby
 * https://github.com/elgrancalavera/grunt-carnaby
 *
 * Copyright (c) 2013 M&C Saatchi
 * Licensed under the MIT license.
 */

'use strict';
var path = require('path');

module.exports = function(grunt) {
  var helpers = require('./lib/helpers').init(grunt);

  // [template, destination] destination relative to base path (added later)

  var commonTemplates = [
    ['mainapp', 'scripts/common/app.js'],
    ['appcontroller', 'scripts/common/controllers/app-controller.js'],
    ['requirebase', 'config.json']
  ];

  var clientTemplates = [
    ['app', 'scripts/app.js'],
    ['requireconf', 'config.json'],
    ['index', 'index.html']
  ];

  var makeTemplateOptionsList = function (templatelist, basepath, options) {
    return grunt.util._.map(templatelist, function (args) {
      return grunt.util._.extend({
        template: args[0],
        filepath: path.join(basepath, args[1])
      }, options);
    });
  };

  var makeCommon = function (options) {
    var basepath = 'common';
    options = grunt.util._.extend({}, options);
    return makeTemplateOptionsList(commonTemplates, basepath, options);
  };

  var makeClient = function (options) {
    var basepath = options.client.name;
    options = grunt.util._.extend({}, options);
    return makeTemplateOptionsList(clientTemplates, basepath, options);
  };

  var processTemplate = function (options) {

    grunt.log.debug('Processing template');
    grunt.log.debug(options.template);
    grunt.log.debug(options.filepath);

    var before = options.before || grunt.util._.identity;
    var appDir = grunt.option('appDir') || 'app';
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
  };

  var processMultipleTemplates = function (optionsList) {
    grunt.util._.each(optionsList, function (options) {
      processTemplate(options);
    });
  };

  var basepath = function () {
    var pathcomponents = [grunt.option('appDir') || 'app'];
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
    grunt.log.ok();
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
    grunt.log.ok();
  });

  /*
   * carnaby:client generates a carnaby client application
   */
  grunt.registerTask('carnaby:client', 'Generates a carnaby client application', function () {
    var name = this.args[0];
    var desc = this.args[1];
    var client = helpers.createClient(name, desc, this.flags.force).readClient(name);
    grunt.verbose.writeflags(client, 'Client');
    grunt.log.ok();
  });

  /*
   * carnaby
   */
  grunt.registerTask('carnaby', 'carnaby project generation and installation', function () {
    var force = this.flags.force;
    var clientname = helpers.defaultclient;
    var project = helpers
      .createProject(force)
      .createDefaultClient(force)
      .readProject();
    var client = helpers.readDefaultClient();
    grunt.verbose.writeflags(project, 'Project');
    grunt.verbose.writeflags(client, 'Client');

    var options = {
      force: force,
      client: client,
      context: {
      }
    };

    var templatesToProcess = [].concat(
      makeCommon(options),
      makeClient(options)
    );

    processMultipleTemplates(templatesToProcess);
    grunt.log.ok();
  });

};
