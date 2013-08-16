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

  var writeClientConfig = function (name, description, force) {
    var config = clientConfig(grunt.option('appDir'), name, description);
    var dest = path.join('.carnaby', name + '.json');
    grunt.verbose.writeflags(this, 'Task');
    helpers.checkFile(dest, this.flags.force);
    grunt.verbose.writeflags(config, 'Default client config');
    grunt.file.write(dest, JSON.stringify(config, null, 2));
    grunt.log.writeln('File "' + dest + '" created.');
    return config;
  };

  var generateCommon = function () {
    var common = path.join('common', 'scripts', 'common');
    return [
      'c:t:mainapp:' + path.join(common, 'app.js'),
      'c:t:appcontroller:' + path.join(common, 'controllers', 'app-controller.js')
    ];
  };

  var generateClient = function (config) {
    return [
      'c:t:app:' + path.join('clients', config.name, 'scripts', 'app.js')
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
    var config = writeClientConfig.call(this, this.args[0], this.args[1] || '');
    run.call(this, generateClient.call(this, config));
  });

  /*
   * c:install generates a default carnaby project
   */
  grunt.registerTask('c:install', 'Generates a default carnaby project', function () {
    var config = writeClientConfig.call(this, 'mobile', 'Default carnaby client.');
    var taskList = [].concat(
      generateCommon.call(this),
      generateClient.call(this, config)
    );
    run.call(this, taskList);
  });

};
