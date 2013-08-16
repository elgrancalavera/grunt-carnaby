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
      tests: ['tmp'],
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
  grunt.registerTask('c:template', [

    'c:t:default-template.js',
    'c:t:amd:amd-template.js',
    'c:t:mainapp:main-app.js',
    'c:t:app:app.js',
    'c:t:appcontroller:app-controller.js',

    'c:t:index:index.html',
    'c:t:html:html.html',

    'c:ti:default-init-template.js',
    'c:ti:amd:amd-init-template.js',
    'c:ti:mainapp:main-app-init.js',
    'c:ti:app:app-init.js',
    'c:ti:appcontroller:app-controller-init.js',

    'c:ti:index:index-init.html',
    'c:ti:html:html-init.html'
  ]);

  grunt.registerTask('c', ['c:template']);
  grunt.registerTask('test', ['clean', 'c', 'nodeunit']);

  grunt.registerTask('default', ['jshint', 'test']);
  grunt.registerTask('code', ['default', 'watch']);

};
