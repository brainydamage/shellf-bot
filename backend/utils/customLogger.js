const log = require('npmlog');

function getFormattedTimestamp() {
  return new Date().toISOString();
}

log.on('log', function (logData) {
  if (logData.prefix !== 'npm') {
    logData.message = `${getFormattedTimestamp()} - ${logData.message}`;
  }
});

module.exports = log;
