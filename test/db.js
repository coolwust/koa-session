'use strict';

var expect = require('chai').expect;
var promisify = require('es6-promisify');
var child_process = require('child_process');
var exec = promisify(child_process.exec);
var fs = require('fs');
var realpath = promisify(fs.realpath);
var co = require('co');

describe('Testing database adapter', function () {
  var child;
  var db;
  beforeEach(function (done) {
    co(function* () {
      yield exec('mkdir -p ' + __dirname + '/fixtures/db');
      var path = yield realpath(__dirname + '/fixtures/db');
      var args = ['--directory', path, '--driver-port', 3001, '--bind', 'all'];
      child = child_process.spawn('rethinkdb', args, { stdio: 'inherit' });
      yield new Promise(function(onFulfilled, onRejected) {
        setTimeout(onFulfilled, 5000);
      });
      db = require('../lib/db.js')({ dbPort: 3001, dbName: 'test' });
    }).then(done, done);
  });
  afterEach(function (done) {
    co(function* () {
      child.kill();
      yield new Promise(function (onFulfilled) { child.on('exit', onFulfilled); });
      yield exec('rm -Rf ' + __dirname + '/fixtures/db');
    }).then(done, done);
  });
  it('Insert and retrive and update record', function (done) {
    co(function* () {
      yield db.init();
      yield new Promise(function (onFulfilled) { setTimeout(onFulfilled, 3000) });
      yield db.insert({ 'sid': 123, url: 'http://www.example.com' });
      var cookie = yield db.retrive(123);
      expect(cookie.url).to.equal('http://www.example.com');
      yield db.update(123, { url: 'http://www.foo.com' });
      var cookie = yield db.retrive(123);
      expect(cookie.url).to.equal('http://www.foo.com');
      yield db.delete(123);
      var cookie = yield db.retrive(123);
      expect(cookie).to.equal(null);
    }).then(done, done);
  });
});
