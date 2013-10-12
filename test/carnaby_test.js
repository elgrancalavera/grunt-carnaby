'use strict';

var grunt = require('grunt');
var path = require('path');
var fs = require('fs');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

function read(filename) {
  return grunt.file.read(filename);
}

function compare(filename, test) {
  var actualFilepath = path.join('tmp', filename);
  var expectedFilepath = path.join('test', 'expected', filename);
  var actual = read(actualFilepath);
  var expected = read(expectedFilepath);
  var msg = 'Text files must be equal.\nActual: "' + actualFilepath +'".\nExpected: "' + expectedFilepath + '".';
  test.equal(actual, expected, msg);
}

exports.carnaby = {
  setUp: function(done) {
    done();
  },
  'all templates': function(test) {
    var dir = fs.readdirSync('test/expected');
    test.expect(dir.length);
    grunt.util._.each(dir, function (filepath) {
      compare(filepath, test);
    });
    test.done();
  }
};
