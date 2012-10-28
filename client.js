var http = require('http');
var https = require('https');

var commonModules = require('starbox-common');
var commonSecure = commonModules.getModule('secure');

var test = require('./test.js');

log = test.log;

function Client(port, server, uid, password, useHttps) {
  this._server = server;
  this._port = port;
  this._uid = uid;
  this._password = password;
  this._sessionId = null;
  this._key = null;
  this._http = useHttps ? https : http;
}

Client.prototype= {
  // A helper function to send request to test server.
  req: function req(path, method, headerMap, data, callback) {
    var opt = {
      host: this._server,
      port: this._port,
      path: path,
      method: method,
      headers: headerMap
    };
    
    // Aggregrate response data.
    var data = '';
    function dataCallback(d) {
      data = data + d.toString();
      log(data);
    }
    function end() {
      callback(data);
    }

    // Send request and bind callback
    var server = this._server;
    var req = this._http.request(opt, function(res) {
      log('Connected to: ' + server);
      res.on('data', dataCallback);
      res.on('end', end);
    });

    if (data) {
      req.end(data);
    } else {
      req.end();
    }
    return req;
  },

  // Callback wrapper, for common response:
  // JSON
  // {
  //   result: '',
  //   info: (json object),
  // }
  _wrapCallback: function wrapCallback(cb) {
    return function(d) {
      var json = JSON.parse(d);
      cb(json.result, json.info);
    }
  },

  setupKey: function setupKey(succCb, errCb) {
    var self = this;
    this.req('/a/getSalt/' + this._uid,
             'GET', null, null,
             this._wrapCallback(function(res, info) {
               if (res === 'OK') {
                 log('Got response to getSalt, user: ' + self._uid);
                 log('Salt: ' + info.salt);
                 self._key = self.computeKey(self._password, info.salt);
                 succCb(self._key);
               } else if (res === 'NO_SUCH_USER') {
                 log('Sever cannot find the user: ' + this._uid);
                 errCb(res);
               } else {
                 log('Unexpected response to setupKey: ' + res);
                 errCb(res);
               }
             }));
  },

  computeKey: function computeKey(pass, salt) {
    var key = commonSecure.getKey(salt, pass);
    return key;
  }
}

// This will return a reference to client and make test runner able to control
// the client. The uid and password must the accepted by server, the test
// accunt and password.
exports.createClient = function(port, server, uid, password, useHttps, logName) {
  return new Client(port, server, uid, password, useHttps);
}
