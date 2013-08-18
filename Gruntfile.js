/*
 * grunt-carnaby
 * https://github.com/leon.coto/grunt-carnaby
 *
 * Copyright (c) 2013 M&C Saatchi
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  grunt.option('appDir', 'tmp');

  // Project configuration.
  grunt.initConfig({
    watch: {
      all: {
        files: '<%= jshint.all %>',
        tasks: ['jshint']
      }
    },
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/**/*.js',
        '<%= nodeunit.tests %>',
        '!**/files/**/*'
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp', '.carnaby'],
    },

    // Configuration to be run (and then tested).
    carnaby: {
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js'],
    },

  });

  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // Carnaby
  grunt.registerTask('carnaby:templates', [

    'carnaby:template:amd:amd-template.js',
    'carnaby:template:mainapp:main-app.js',
    'carnaby:template:app:app.js',
    'carnaby:template:appcontroller:app-controller.js',

    'carnaby:template:index:index.html',
    'carnaby:template:html:html.html',

    'carnaby:init-template:amd:amd-init-template.js',
    'carnaby:init-template:mainapp:main-app-init.js',
    'carnaby:init-template:app:app-init.js',
    'carnaby:init-template:appcontroller:app-controller-init.js',

    'carnaby:init-template:index:index-init.html',
    'carnaby:init-template:html:html-init.html'
  ]);

  grunt.registerTask('test', ['clean', 'carnaby:templates', 'nodeunit']);

  grunt.registerTask('default', ['jshint', 'test']);
  grunt.registerTask('code', ['default', 'watch']);

};
