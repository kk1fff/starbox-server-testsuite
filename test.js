var runningQueue = [];
var finishedTest = 0;
var nowRunning = null;
var preceed = true;

function formattedLog(outputFunc, str) {
  if (!str) {
    str = 'null';
  }

  var prefix = "| ";
  if (nowRunning) {
    prefix = nowRunning + " | ";
  }
  outputFunc(prefix + str.replace('\n', '\n' + prefix));
}

function errlog(str) {
  formattedLog(console.error, str);
}

function log(str) {
  formattedLog(console.log, str);
}

function logStart(name) {
  log('Beginning of test: ' + name);
  nowRunning = name;
}

function logEnd() {
  nowRunning = null;
  finishedTest++;
}

exports.addTest = function addTest(name, test) {
  runningQueue.push({
    name: name,
    func: test
  });
}

exports.wait = function wait() {
  preceed = false;
}

exports.finish = function finish() {
  preceed = true;
  logEnd();
  exports.run();
}

exports.run = function run() {
  while (runningQueue.length > 0 && preceed) {
    var t = runningQueue.shift();
    logStart(t.name);
    try {
      t.func();
    } catch (e) {
      logErr('Fail: \n' + e.stack);
    }
    
    if (preceed) {
      logEnd();
    }
  }
}

exports.log = log;
