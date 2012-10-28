var http = require('http');
var https = require('https');
var commonModules = require('starbox-common');

function Client(port, server, uid, password, useHttps) {
  this._server = server;
  this._port = port;
  this._uid = uid;
  this._password = password;
  this._sessionId = null;
  this._key = null;
  this._http = useHttps ? https : http;
}

Client.__proto__ = {
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
      data += d.toString('utf8');
    }
    function end() {
      callback(data);
    }

    // Send request and bind callback
    var req = this._http.request(opt, dataCallback);
    req.on('end', end);

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
  wrapCallback: function wrapCallback(cb) {
    return function(d) {
      var json = JSON.parse(d);
      cb(json.result, json.info);
    }
  },

  setupKey: function setupKey() {
    this.req('/setupKey?user=' + this._uid,
             'GET', null, null,
             this.wrapCallback(function(res, info) {
               if (res === 'OK') {
                 log('Got response to setupKey, user: ' + this._uid);
                 log('Salt: ' + info.salt);
                 this._key = this.computeKey(this._password, info.salt);
               } else if (res === 'NO_SUCH_USER') {
                 log('Sever cannot find the user: ' + this._uid);
               } else {
                 log('Unexpected response to setupKey: ' + res);
               }
             }));
  },
}

// This will return a reference to client and make test runner able to control
// the client. The uid and password must the accepted by server, the test
// accunt and password.
exports.createClient = function(port, server, uid, password, useHttps) {
  return new Client(port, server, uid, password, useHttps);
}
