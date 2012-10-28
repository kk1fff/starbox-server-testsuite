var client = require('./client.js');
var test = require('./test.js');

test.addTest('TestBuildKey', function () {
  var c = client.createClient(5000, 'localhost', 'iamauser', 'abcd', false);
  test.wait();
  c.setupKey(function(key) {
    test.log(key);
    test.finish();
  });
});

test.run();
