'use strict';

//--------------------------------------------------------------------------
//
// Template definitions
//
//--------------------------------------------------------------------------

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
