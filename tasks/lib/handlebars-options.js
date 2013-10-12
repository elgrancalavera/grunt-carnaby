/*
 * carnaby
 * tasks/lib/handlebars-options.js
 * https://github.com/elgrancalavera/grunt-carnaby
 *
 * Copyright (c) 2013 M&C Saatchi
 * Licensed under the MIT license.
 */
'use strict';
var path = require('path');

exports.init = function (grunt) {
  var helpers = require('./helpers').init(grunt);
  var tmpdir = helpers.tmpDir;

  // 3 is the default offset, which is 3 directories away from .
  // ./tmp_dir/[client]/templates
  //  1       2        3
  // \_________________/
  //  defaultPathOffset
  var defaultPathOffset = 3;

  // nesting: how deep inside tmpdir are the templates, for instance:
  // ./parent_dir/parent_dir/tmp_dir/[client]/templates
  //  1          2          3       4        5
  // \_____________________/\________________/
  //  nesting                defaultPathOffset
  var nesting = path.normalize(tmpdir).split('/').length  - 1;

  var pathOffset = nesting + defaultPathOffset;

  var handlebarsFilePath = function (filepath) {
    // The first n indices we need to skip to reach the templates directory
    return filepath.split('/').slice(pathOffset).join('/').replace('.hbs', '');
  };

  var handlebarsProcessName =  function (filepath) {
    return handlebarsFilePath(filepath);
  };

  var handlebarsProcessPartialName = function (filepath) {
    return handlebarsFilePath(filepath).replace('_', '');
  };

  return function (options) {
    options = options || {};
    options.namespace = options.namespace || 'jst';
    options.processName = handlebarsProcessName;
    options.processPartialName = handlebarsProcessPartialName;
    // Otherwise references to Handlebars are lost from function calls
    // within files shimmed by Requirejs
    options.wrapped = true;
    return options;
  };

};
