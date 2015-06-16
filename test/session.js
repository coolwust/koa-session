'use strict';

var koa = require('koa');
var expect = require('chai').expect;
var session = require('../lib/session.js');
var http = require('http');
var promisify = require('es6-promisify');
var child_process = require('child_process');
var exec = promisify(child_process.exec);
var fs = require('fs');
var realpath = promisify(fs.realpath);
var co = require('co');

var app = koa();
app.keys = ['myFirstKey'];
app.use(session({ dbPort: 3001, dbName: 'test' }));
app.use(function* () {
  switch (this.request.url) {
    case '/login':
      this.session.id = '123456';
      this.response.body = this.session.id;
      break;
    case '/name':
      this.response.body = this.session.id || 'no-login';
      break;
    case '/logout':
      this.session = null;
      break;
  }
});

var server = app.listen(3000);

function parseCookies(cookies) {
  var arr = [];
  cookies.forEach(function (cookie) {
    arr.push(cookie.split(';').shift());
  });
  return arr.join('; ');
}

describe('Testing session middleware', function () {

  var child;
  beforeEach(function (done) {
    co(function* () {
      yield exec('mkdir -p ' + __dirname + '/fixtures/db');
      var path = yield realpath(__dirname + '/fixtures/db');
      var args = ['--directory', path, '--driver-port', 3001, '--bind', 'all'];
      child = child_process.spawn('rethinkdb', args, { stdio: 'inherit' });
      yield new Promise(function(onFulfilled, onRejected) {
        setTimeout(onFulfilled, 5000);
      });
    }).then(done, done);
  });
  afterEach(function (done) {
    co(function* () {
      child.kill();
      yield new Promise(function (onFulfilled) { child.on('exit', onFulfilled); });
      yield exec('rm -Rf ' + __dirname + '/fixtures/db');
    }).then(done, done);
  });

  it('Set name in session object', function (done) {
    var req = http.request({ path: '/login', port: 3000 });
    req.on('response', function (rep) {
      rep.on('data', function (data) {
        expect(data.toString()).to.equal('123456');
        expect(rep.statusCode).to.equal(200);
        done();
      });
    });
    req.end();
  });

  //it('Get name in session object', function (done) {
  //  var req1 = http.request({ path: '/login', port: 3000 });
  //  req1.on('response', function (rep1) {
  //    var cookies = parseCookies(rep1.headers['set-cookie']);
  //    var req2 = http.request({ path: '/name', port: 3000 });
  //    req2.setHeader('Cookie', cookies);
  //    req2.on('response', function (rep2) {
  //      rep2.on('data', function (data) {
  //        expect(data.toString()).to.equal('123456');
  //        done();
  //      });
  //    });
  //    req2.end();
  //  });
  //  req1.end();
  //});

  //it('Delete name in session object', function (done) {
  //  var req1 = http.request({ path: '/login', port: 3000 });
  //  req1.on('response', function (rep1) {
  //    var cookies = parseCookies(rep1.headers['set-cookie']);
  //    var req2 = http.request({ path: '/name', port: 3000 });
  //    req2.setHeader('Cookie', cookies);
  //    req2.on('response', function (rep2) {
  //      rep2.on('data', function (data) {
  //        expect(data.toString()).to.equal('123456');
  //        var req3 = http.request({ path: '/logout', port: 3000 });
  //        req3.setHeader('Cookie', cookies);
  //        req3.on('response', function () {
  //          var req4 = http.request({ path: '/name', port: 3000 });
  //          req4.on('response', function (rep4) {
  //            rep4.on('data', function (data) {
  //              expect(data.toString()).to.equal('no-login');
  //              done();
  //            });
  //          });
  //          req4.end();
  //        });
  //        req3.end();
  //      });
  //    });
  //    req2.end();
  //  });
  //  req1.end();
  //});
});
