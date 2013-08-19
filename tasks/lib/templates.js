/*
 * carnaby
 * tasks/lib/templates.js
 * https://github.com/elgrancalavera/grunt-carnaby
 *
 * Copyright (c) 2013 M&C Saatchi
 * Licensed under the MIT license.
 */
'use strict';

//--------------------------------------------------------------------------
//
// Template definitions
//
//--------------------------------------------------------------------------

//----------------------------------
//
// JSON
//
//----------------------------------

exports.requirebase = [
  'json/require-base.json'
];

exports.requireconf = [
  'json/require-client.json'
];

exports.requireconflocal = [
  'json/require-client-local.json'
];

exports.requireconfdev = [
  'json/require-client-dev.json'
];

exports.requireconfqa = [
  'json/require-client-qa.json'
];

exports.requireconfprod = [
  'json/require-client-prod.json'
];

//----------------------------------
//
// Handlebars
//
//----------------------------------

exports.hbs = [
  'hbs/header.hbs',
  'hbs/body.hbs',
  'hbs/footer.hbs'
];

//----------------------------------
//
// JS
//
//----------------------------------

exports.def = [
  'js/header.js',
  'js/footer.js'
];

exports.amd = [
  'js/header.js',
  'js/header-amd.js',
  'js/footer-amd.js',
  'js/footer.js'
];


// Just because I like this alias :)
exports.sugar = exports.amd;

exports.mainapp = [
  'js/header.js',
  'js/header-amd.js',
  'js/main-app.js',
  'js/footer-amd.js',
  'js/footer.js'
];

exports.app = [
  'js/header.js',
  'js/header-amd.js',
  'js/app.js',
  'js/footer-amd.js',
  'js/footer.js'
];

exports.appcontroller = [
  'js/header.js',
  'js/header-amd.js',
  'js/app-controller.js',
  'js/footer-amd.js',
  'js/footer.js'
];

exports.main = [
  'js/header.js',
  'js/main.js',
  'js/footer.js'
];

exports.itemview = [
  'js/header.js',
  'js/header-amd.js',
  'js/item-view.js',
  'js/footer-amd.js',
  'js/footer.js'
];

//----------------------------------
//
// HTML
//
//----------------------------------

// A very simple HTML template
exports.html = [
  'html/header.html',
  'html/styles.html',
  'html/body.html',
  'html/scripts.html',
  'html/footer.html'
];

// Just like the previous one but assumes an AMD app
// will be embedded in the page.
exports.index = [
  'html/header.html',
  'html/styles.html',
  'html/styles-index.html',
  'html/body.html',
  'html/body-index.html',
  'html/scripts.html',
  'html/scripts-index.html',
  'html/footer.html'
];
