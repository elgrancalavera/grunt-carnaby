/*
 * grunt-carnaby
 * ./Gruntfile.js
 * https://github.com/leon.coto/grunt-carnaby
 *
 * Copyright (c) 2013 M&C Saatchi
 * Licensed under the MIT license.
 */
'use strict';

/*global module:false*/
var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

module.exports = function(grunt) {

  // Project configuration.

  grunt.initConfig({

    //--------------------------------------------------------------------------
    //
    // Carnaby
    //
    //--------------------------------------------------------------------------

    carnaby: {
      appDir: 'tmp'
    },

    //--------------------------------------------------------------------------
    //
    // Grunt
    //
    //--------------------------------------------------------------------------

    connect: {
      options: {
        port: 9000,
        // change this to '0.0.0.0' to access the server from outside
        hostname: 'localhost'
      },
      dist: {
        options: {
          middleware: function (connect) {
            return [
              mountFolder(connect, 'dist')
            ];
          }
        }
      },
      livereload: {
        options: {
          middleware: function (connect) {
            return [
              lrSnippet,
              mountFolder(connect, '.carnaby/tmp'),
              mountFolder(connect, 'vendor'),
              mountFolder(connect, grunt.config('carnaby.appDir'))
            ];
          }
        }
      }
    },

    copy: {
      test: {
        files: {
          '.carnaby/tmp/test.txt': 'test/fixtures/test.txt'
        }
      }
    },

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

    // Before generating any new files, remove any files created previously.
    clean: ['tmp', '.carnaby/*', 'dist'],

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js'],
    }

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
    'carnaby:client:desktop',
    'carnaby:templates',
    'jshint:artifacts',
    'nodeunit'
  ]);

  grunt.registerTask('code', ['jshint:dev', 'watch']);

};
