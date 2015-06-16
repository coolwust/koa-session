'use strict';

var r = require('rethinkdb');

module.exports = db;

function db(options) {
  options = {
    host: options.dbHost || 'localhost',
    port: options.dbPort || 28015,
    db: options.dbName || 'test'

  };
  var connect = r.connect(options);
  return {
    init: function* () {
      var conn = yield connect;
      yield r.db(options.db).tableCreate('session', { primaryKey: 'sid' }).run(conn);
    },
    insert: function* (cookies) {
      var conn = yield connect;
      yield r.table('session').insert(cookies).run(conn);
    },
    update: function* (sid, cookies) {
      var conn = yield connect;
      yield r.table('session').get(sid).update(cookies).run(conn);
    },
    retrive: function* (sid) {
      var conn = yield connect;
      var cookie = yield r.table('session').get(sid).run(conn);
      return cookie;
    },
    delete: function* (sid) {
      var conn = yield connect;
      yield r.table('session').get(sid).delete().run(conn);
    }
  }
}

