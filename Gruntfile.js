/*global module:false*/
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
var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({ port: LIVERELOAD_PORT });
var mountFolder = function (connect, dir) {
  return connect.static(path.resolve(dir));
};

module.exports = function(grunt) {

  grunt.initConfig({
    carnaby: {
      appDir: 'app',
      bowerDir: grunt.file.readJSON('.bowerrc').directory,
      targetDir: 'targets',
      vendorDir: 'vendor',
      tmpDir: '.tmp',
      symlinks: {
        common: '.symlinks/common',
        vendor: '.symlinks/vendor',
      },
    },
    connect: {
      options: {
        port: 9000,
        // change this to '0.0.0.0' to access the server from outside
        hostname: 'localhost'
      },
      livereload: {
        options: {
          middleware: function (connect) {
            return [
              lrSnippet,
              mountFolder(connect, grunt.config('carnaby.symlinks.common')),
              mountFolder(connect, grunt.config('carnaby.symlinks.vendor')),
              mountFolder(connect, grunt.config('carnaby.tmpDir')),
              mountFolder(connect, grunt.config('carnaby.appDir')),
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
          '<%= carnaby.appDir %>/**/*.html',
          '.carnaby/tmp/*/scripts/templates.js'
        ]
      },
      updateConfig: {
        files: '.carnaby/project.json',
        tasks: ['carnaby:update-config']
      },
      project: {
        files: '<%= jshint.project %>',
        tasks: ['jshint:project']
      },
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
      },
      project: [
        'Gruntfile.js',
        '<%= carnaby.appDir %>/core/common/scripts/**/*.js',
        'tasks/**/*.js',
        '!**/templates/**/*',
      ],
      artifacts: [
        '<%= carnaby.appDir %>/**/*.{js,json}'
      ]
    },

    // Before generating any new files, remove any files created previously.
    clean: {
      all: [
        '<%= carnaby.appDir %>',
        '<%= carnaby.targetDir %>',
        '<%= carnaby.tmpDir %>',
        '<%= carnaby.symlinks.common %>',
        '<%= carnaby.symlinks.vendor %>',
        '.carnaby/*',
        '.preflight',
        '.sass-cache',
      ]
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
  ]);

  var workflow =  [
    'clean',
    'carnaby:new-project',
    'carnaby:build'
  ];
  var workflow_long = [
    'carnaby:workflow',
    'carnaby:new-client:phablet',
    'carnaby:new-target:s3:aws/s3:Static deployment to S3',
    'carnaby:build:all',
    'carnaby:delete-target:s3',
    'carnaby:clean-client:phablet',
    'carnaby:build:all'
  ];

  grunt.registerTask('carnaby:workflow', workflow);

  grunt.registerTask('carnaby:workflow:watch', workflow.concat(
    'jshint',
    'connect:livereload',
    'watch'
  ));

  grunt.registerTask('carnaby:workflow:long:watch', workflow_long.concat(
    'jshint',
    'connect:livereload',
    'watch'
  ));

  grunt.registerTask('default', [
    'clean',
    'jshint',
    'carnaby:templates',
    'jshint:artifacts',
    'nodeunit',
    'clean',
    'carnaby:workflow',
    'jshint:artifacts'
  ]);

  grunt.registerTask('carnaby:start', [
    'carnaby:update-client:all',
    'jshint',
    'connect:livereload',
    'watch'
  ]);

  grunt.registerTask('start', [
    'jshint',
    'connect:livereload',
    'watch'
  ]);

};
