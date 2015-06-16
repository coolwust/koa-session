'use strict';

var db = require('./db.js');

function session(options) {

  var sessions = {};
  db = db(options);

  return function* (next) {

    function* loadSession(ctx) {
      var sid = ctx.cookies.get('sid');
      var session = yield db.retrive(sid);
      if (session) {
        ctx.session = session;
      } else {
        sid = null;
        ctx.session = {};
      }
      return sid;
    }

    function* saveSession(ctx, sid) {
      if (ctx.session) {
        sid = (sid !== null) || Math.ceil(Math.random() * 100000000000000000);
        session.sid = sid;
        yield db.insert(session);
        var options = {
          maxAge: 24 * 60 * 60,
          signed: true,
          overwrite: true
        };
        for (var key in ctx.session) {
          ctx.cookies.set(key, ctx.session[key], options);
        }
      } else {
        if (sid === null) return;
        sid = yield db.retrive(sid);
        if (sid) {
          yield db.delete(sid);
        }
        ctx.cookies.set('sid');
      }
    }

    var sid = yield loadSession(this);
    yield next;
    yield saveSession(this, sid);

  }
}

module.exports = session;
