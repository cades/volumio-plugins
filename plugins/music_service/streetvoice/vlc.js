const fetch = require('node-fetch');
const base64 = require('base-64');

function play(url) {
  return callVlcApi('http://localhost:8080/requests/status.xml?command=in_play&input=' + url);
}

function seek(sec) {
  return callVlcApi('http://localhost:8080/requests/status.xml?command=seek&val=' + sec);
}

function pause() {
  return callVlcApi('pause');
}

function resume() {
  return callVlcApi('play');
}

function stop() {
  return callVlcApi('stop');
}

function vlcCommand(command) {
  return callVlcApi('http://localhost:8080/requests/status.xml?command=pl_' + command);
}

function callVlcApi(url) {
  return fetch(url, {
	  headers: {
	    'Authorization': 'Basic ' + base64.encode(":test")
	  }
  })
    .then(res => res.text());
}

module.exports = {
  play,
  seek,
  pause,
  resume,
  stop
};
