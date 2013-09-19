/*
 * grunt-carnaby
 * ./Gruntfile.js
 * https://github.com/leon.coto/grunt-carnaby
 *
 * Copyright (c) 2013 M&C Saatchi
 * Licensed under the MIT license.
 */
'use strict';
var path = require('path');
/*global module:false*/
var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});
var mountFolder = function (connect, dir) {
  return connect.static(path.resolve(dir));
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
      appDir: 'tmp',
      bowerDir: grunt.file.readJSON('.bowerrc').directory,
      targetDir: 'targets'
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
              mountFolder(connect, path.join(grunt.config('carnaby.appDir') , 'core')),
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
      options: {
        nospawn: true,
        livereload: true
      },
      livereload: {
        options: {
          livereload: LIVERELOAD_PORT
        },
        files: [
          'tmp/*.html'
        ]
      },
      dev: {
        files: '<%= jshint.dev %>',
        tasks: ['jshint:dev']
      },
      updateConfig: {
        files: '.carnaby/project.json',
        tasks: ['carnaby:update-config']
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
    clean: {
      all: ['tmp/*', '.carnaby/*', 'targets']
    },

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
    'carnaby:init-template:html:html-init.html',


  ]);

  grunt.registerTask('carnaby:workflow', [
    'clean',
    'carnaby:new-project',
    'carnaby:new-client:bacon-sandwich',
    'carnaby:new-target:piccadilly-billboard:non/standard/path:One of those big billboard things',
    'carnaby:new-target:aws'
  ]);

  grunt.registerTask('default', [
    'clean',
    'jshint:dev',
    'carnaby:templates',
    'jshint:artifacts',
    'nodeunit',
    'clean',
    'carnaby:workflow',
    'jshint:artifacts',
  ]);

  grunt.registerTask('ci', [
    'clean',
    'carnaby:workflow',
    'jshint:dev',
    'connect:livereload',
    'watch',
  ]);

};
