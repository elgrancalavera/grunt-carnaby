/*
 * carnaby
 * https://github.com/leon.coto/grunt-carnaby
 *
 * Copyright (c) 2013 M&C Saatchi
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');

// Running this task without arguments should generate the runtime for a Carnaby
// application.

// flags (listed in order of precedence):
// - init: means we don't want to process the templates but use them as part of
//   the grunt-carnaby-init template. We leave the files as they are and replace
//   the delimiters to match the grunt-init delimiter style.
var flags = [
  'init'
];


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

    var templatename;
    var filepath = path.join(options.appDir, grunt.util._.last(this.args));
    var filename = grunt.util._.last(filepath.split('/'));
    var context = grunt.util._.extend(helpers.readPackage(), {
      filename: filename
    });

    if (this.args.length === 2) {
      templatename = grunt.util._.first(this.args);
    }

    var template = helpers.getTemplate(templatename);
    template = before(template);
    template = grunt.template.process(template, { data: context });

    grunt.verbose.writeflags(options, 'Options');
    grunt.log.debug(template);
    grunt.log.debug(filepath);
    grunt.file.write(filepath, template);

  };

  var writeTemplate = function (template, context) {
    grunt.log.debug('writeTemplate');
    grunt.log.debug(template.filepath);
    grunt.file.write(
      template.filepath,
      grunt.template.process(template.template, { data: context }));
  };

  var writeClientConfig = function (name, description, force) {
    var config = clientConfig(grunt.option('appDir'), name, description);
    var dest = path.join('.carnaby', name + '.json');
    var exists = grunt.file.exists(dest);
    grunt.verbose.writeflags(this, 'Task');
    grunt.verbose.writeln((dest + 'already exists?').cyan, exists.toString().yellow);
    var existsMsg = 'The "' + name  + '" client already exists. ';
    if (exists && !this.flags.force) {
      grunt.fatal(
        existsMsg +
        'Aborting.\nAppend ":force" at the end of you task call to overwrite it.'
      );
    }
    if (exists && this.flags.force) {
      grunt.log.writeln((existsMsg + 'Overwriting.').yellow);
    }
    grunt.verbose.writeflags(config, 'Default client config');
    grunt.file.write(dest, JSON.stringify(config, null, 2));
    grunt.log.writeln('File "' + dest + '" created.');
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

  });

  /*
   * c:install generates a default carnaby project
   */
  grunt.registerTask('c:install', 'Generates a default carnaby project', function () {
    writeClientConfig.call(this, 'mobile', 'Default carnaby client.');
  });

};
