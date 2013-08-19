/*
 * carnaby
 * tasks/lib/handlebars-options.js
 * https://github.com/elgrancalavera/grunt-carnaby
 *
 * Copyright (c) 2013 M&C Saatchi
 * Licensed under the MIT license.
 */
'use strict';

exports.init = function (grunt) {

  var pathOffset = grunt.config('carnaby.hbsPathOffset') || 4;

  var handlebarsFilePath = function (filepath) {
    // The first n indices we need to skipt to reach the actual
    // templates directory.
    return filepath.split('/').slice(pathOffset).join('/').replace('.hbs', '');
  };

  var handlebarsProcessName =  function (filepath) {
    return handlebarsFilePath(filepath);
  };

  var handlebarsProcessPartialName = function (filepath) {
    return handlebarsFilePath(filepath).replace('_', '');
  };

  var handlebarsOptions = function (options) {
    options = options || {};
    options.namespace = options.namespace || 'jst';
    options.processName = handlebarsProcessName;
    options.processPartialName = handlebarsProcessPartialName;
    // Otherwise references to Handlebars are lost from function calls
    // within files shimmed by Requirejs
    options.wrapped = true;
    return options;
  };

  return handlebarsOptions;
};
