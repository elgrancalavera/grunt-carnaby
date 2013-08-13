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

    var template;
    var filepath = path.join(options.appDir, grunt.util._.last(this.args));
    var filename = grunt.util._.last(filepath.split('/'));
    var context = grunt.util._.extend(helpers.readPackage(), {
      filename: filename
    });

    if (this.args.length === 2) {
      template = grunt.util._.first(this.args);
    }

    template = helpers.getTemplate(template);
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

  grunt.registerTask('carnaby', 'Writes a file using a template.', function() {
    processTemplate.call(this);
  });

  grunt.registerTask('carnaby:init', 'Writes a file for grunt-init-carnaby', function () {
    processTemplate.call(this, function (template) {
      return template.replace(/<%/g, '{%').replace(/%>/g, '%}');
    });
  });


};
