/*
 * carnaby
 * https://github.com/leon.coto/grunt-carnaby
 *
 * Copyright (c) 2013 M&C Saatchi
 * Licensed under the MIT license.
 */

'use strict';
var path = require('path');

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerTask('carnaby', 'The Carnaby workflow.', function() {
    var args = grunt.util._.toArray(arguments);
    var options = this.options({
      appDir: 'app'
    });

    var template = 'default';
    var filepath = args[0];
    var filename = grunt.util._.last(filepath);

    if (args.length === 2) {
      template = args[0];
      filepath = args[1];
    }

    grunt.verbose.writeflags(this, 'Task');
    grunt.verbose.writeflags(options, 'Options');
    grunt.log.debug(template);
    grunt.log.debug(filepath);

    grunt.file.write(path.join(options.appDir, filepath), '\n');

  });

};
