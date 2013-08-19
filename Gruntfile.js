/*
 * grunt-carnaby
 * ./Gruntfile.js
 * https://github.com/leon.coto/grunt-carnaby
 *
 * Copyright (c) 2013 M&C Saatchi
 * Licensed under the MIT license.
 */
'use strict';

module.exports = function(grunt) {

  // Project configuration.

  grunt.initConfig({
    copy: {},
    handlebars: {},
    extend: {},
    watch: {
      dev: {
        files: '<%= jshint.dev %>',
        tasks: ['jshint:dev']
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
      },
      dev: [
        'Gruntfile.js',
        'tasks/**/*.js',
        '<%= nodeunit.tests %>',
        '!tasks/files/**/*'
      ],
      artifacts: [
        'tmp/**/*.{js,json}'
      ]
    },

    // Before generating any new files, remove any previously-created files.
    clean: ['tmp', '.carnaby'],

    // Configuration to be run (and then tested).
    carnaby: {
      appDir: 'tmp'
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

  grunt.registerTask('default', [
    'clean',
    'jshint:dev',
    'carnaby',
    'carnaby:templates',
    'jshint:artifacts',
    'nodeunit'
  ]);

  grunt.registerTask('code', ['jshint:dev', 'watch']);

};
