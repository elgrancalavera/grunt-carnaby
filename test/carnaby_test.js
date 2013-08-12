'use strict';

var grunt = require('grunt');
var path = require('path');

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
  var actual = read(path.join('tmp', filename));
  var expected = read(path.join('test', 'expected', filename));
  test.equal(actual, expected, 'Text files shoule be equal: "' + filename +'"');
}

exports.carnaby = {
  setUp: function(done) {
    done();
  },
  'header template': function(test) {
    test.expect(1);
    compare('header', test);
    test.done();
  }
};
