/*
 * carnaby
 * https://github.com/leon.coto/grunt-carnaby
 *
 * Copyright (c) 2013 M&C Saatchi
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');

// default client configuration
var clientConfig = function (root, name, description) {
  return {
    name: name,
    description: description || '',
    root: path.join(root, 'clients', name),
    config: path.join(root, 'clients', name, 'config.json')
  };
};

module.exports = function(grunt) {
  var helpers = require('./lib/helpers').init(grunt);

  var processTemplate = function (before) {
    grunt.verbose.writeflags(this, 'this');

    if (!this.args.length) {
      return helpers.usage();
    }

    before = before || grunt.util._.identity;
    var options = {
      appDir: grunt.option('appDir') || 'app'
    };

    var args = helpers.removeFlags(this.args);

    var templatename;
    var filepath = path.join(options.appDir, grunt.util._.last(args));
    helpers.checkFile(filepath, this.flags.force);
    var filename = grunt.util._.last(filepath.split('/'));
    var context = grunt.util._.extend(helpers.readPackage(), {
      filename: filename
    });

    if (args.length === 2) {
      templatename = grunt.util._.first(args);
    }

    var template = helpers.getTemplate(templatename);
    template = before(template);
    template = grunt.template.process(template, { data: context });

    grunt.verbose.writeflags(options, 'Options');
    grunt.log.debug(template);
    grunt.log.debug(filepath);
    grunt.file.write(filepath, template);

  };

  var generateCommon = function () {
    var common = path.join('common', 'scripts', 'common');
    return [
      'c:t:mainapp:' + path.join(common, 'app.js'),
      'c:t:appcontroller:' + path.join(common, 'controllers', 'app-controller.js')
    ];
  };

  var generateClient = function (client) {
    return [
      'c:t:app:' + path.join('clients', client.name, 'scripts', 'app.js')
    ];
  };

  var run = function (taskList) {
    taskList = helpers.checkForce(taskList, this.flags.force);
    grunt.task.run(taskList);
  };

  //--------------------------------------------------------------------------
  //
  // Tasks
  //
  //--------------------------------------------------------------------------

  /*
   * c:t carnaby template task
   */
  grunt.registerTask('c:t', 'Writes a file from a template.', function() {
    processTemplate.call(this);
  });

  /*
   * c:ti carnaby template for grunt-init-carnaby
   *  ti templates don't replace any template tokens, just change their syntax
   *  and leaves them in place to be used developing grunt-init-carnaby
   */
  grunt.registerTask(
    'c:ti', 'Writes a file for grunt-init-carnaby from a template', function () {
    processTemplate.call(this, function (template) {
      return template.replace(/<%/g, '{%').replace(/%>/g, '%}');
    });
  });

  /*
   * c:client generates a carnaby client application
   */
  grunt.registerTask('c:client', 'Generates a carnaby client application', function () {
    var name = this.args[0];
    var desc = this.args[1];
    var client = helpers.createClient(name, desc, this.flags.force).readClient(name);
    grunt.verbose.writeflags(client, 'Client');
    run.call(this, generateClient.call(this, client));
  });

  /*
   * carnaby: if a .carnaby/projec.json file exists, installs the project from the
   *  file definition. If there is not a project file, generates de default
   *  carnaby project.
   */
  grunt.registerTask('c:install', 'carnaby project generation and installation', function () {
    var force = this.flags.force;
    var project = helpers
      .createProject(force)
      .createDefaultClient(force)
      .readProject();
    var client = helpers.readDefaultClient();
    grunt.verbose.writeflags(project, 'Project');
    grunt.verbose.writeflags(client, 'Client');
    var taskList = [].concat(
      generateCommon.call(this),
      generateClient.call(this, client)
    );
    run.call(this, taskList);
  });

};
