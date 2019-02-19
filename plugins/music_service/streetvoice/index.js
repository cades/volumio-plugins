'use strict';

const libQ = require('kew');
const config = new (require('v-conf'))();
const { spawn } = require('child_process');
const { getPlaylist, searchForSongs, convertSongUrlToM3u8Url, getM3u8Info, getTrackInfo } = require('./lib');
const player = require('./player')();

// reimplement Promise API using kew...WTF
function Promise(fn) {
  const defer = libQ.defer();
  fn(x => defer.resolve(x), x => defer.reject(x));
  return defer.promise;
}

Promise.resolve = x => libQ.resolve(x);
Promise.reject = x => libQ.reject(x);

module.exports = streetvoice;
function streetvoice(context) {
  this.context = context;
  this.commandRouter = this.context.coreCommand;
  this.logger = this.context.logger;
  this.configManager = this.context.configManager;
}

streetvoice.prototype.onVolumioStart = volumiofy(function() {
  const configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
  this.config = new (require('v-conf'))();
  this.config.loadFile(configFile);
});

streetvoice.prototype.onStart = volumiofy(function() {
  this.logger.info('[StreetVoice] start');
  this.commandRouter.pushToastMessage('success', "Plugin Start!", "StreetVoice plugin start successfully");
  this.addToBrowseSources();

  this.servicename = 'streetvoice';
  this.displayname = 'StreetVoice';
  this.state = {
    status: 'stop',
    service: this.servicename,
    title: '',
    artist: '',
    album: '',
    albumart: '/albumart',
    uri: '',
    trackType: 'streetvoice',
    seek: 0,
    duration: 0,
    channels: 2,
    streaming: true
  };

  player.launch();
  player.on('stateChange', ({ position, duration, status }) => {
    this.state.seek = position;
    if (status === 'stopped') this.state.status = 'stop';
    if (status === 'paused') this.state.status = 'pause';
    if (status === 'playing') this.state.status = 'play';
    this.pushState();
  });
});

streetvoice.prototype.onStop = volumiofy(function() {
  this.logger.info('[StreetVoice] stop');
  player.stop();
  player.quit();
});

streetvoice.prototype.onRestart = volumiofy(function() {
  // Optional, use if you need it
});


// Configuration Methods -----------------------------------------------------------------------------

streetvoice.prototype.getUIConfig = function() {
  const lang_code = this.commandRouter.sharedVars.get('language_code');

  return new Promise((resolve, reject) => {
    this.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
                                __dirname+'/i18n/strings_en.json',
                                __dirname + '/UIConfig.json')
      .then(uiconf => resolve(uiconf))
      .fail(() => reject(new Error()));
  });
};

streetvoice.prototype.getConfigurationFiles = function() {
  return ['config.json'];
}

streetvoice.prototype.setUIConfig = function(data) {
  //Perform your installation tasks here
};

streetvoice.prototype.getConf = function(varName) {
  //Perform your installation tasks here
};

streetvoice.prototype.setConf = function(varName, varValue) {
  //Perform your installation tasks here
};



// Playback Controls ---------------------------------------------------------------------------------------
// If your plugin is not a music_sevice don't use this part and delete it


streetvoice.prototype.addToBrowseSources = volumiofy(function () {
  // Use this function to add your music service plugin to music sources
  const data = {
    name: 'StreetVoice',
    uri: 'streetvoice',
    plugin_type: 'music_service',
    plugin_name: 'streetvoice',
    albumart: '/albumart?sourceicon=music_service/streetvoice/TypeS.png'
  };
  this.commandRouter.volumioAddToBrowseSources(data);
});

streetvoice.prototype.handleBrowseUri = volumiofy(async function (uri) {
  //self.commandRouter.logger.info(uri);
  if (!uri.startsWith('streetvoice'))
    throw new Error('uri not matched streetvoice');

  if (uri === 'streetvoice') {
    return {
      "navigation": {
        "prev": {
          "uri": "/"
        },
        "lists": [
          {
            "availableListViews": ["list","grid"],
            "items": [{
              "type": "folder",
              "title": "StreetVoice 即時熱門",
              "icon": "fa fa-folder-open-o",
              "uri": "streetvoice/24hr"
            }, {
              "type": "folder",
              "title": "所有類型",
              "icon": "fa fa-folder-open-o",
              "uri": "streetvoice/0"
            }, {
              "type": "folder",
              "title": "民謠/抒情/Acapella/成人當代",
              "icon": "fa fa-folder-open-o",
              "uri": "streetvoice/1"
            }, {
              "type": "folder",
              "title": "搖滾/另類/金屬/龐克",
              "icon": "fa fa-folder-open-o",
              "uri": "streetvoice/2"
            }, {
              "type": "folder",
              "title": "嘻哈/饒舌/雷鬼/Funk",
              "icon": "fa fa-folder-open-o",
              "uri": "streetvoice/3"
            }, {
              "type": "folder",
              "title": "舞曲/Remix/ACG/電音",
              "icon": "fa fa-folder-open-o",
              "uri": "streetvoice/4"
            }, {
              "type": "folder",
              "title": "R&B/靈魂/藍調/爵士/拉丁",
              "icon": "fa fa-folder-open-o",
              "uri": "streetvoice/5"
            }, {
              "type": "folder",
              "title": "古典/演奏/New Age",
              "icon": "fa fa-folder-open-o",
              "uri": "streetvoice/6"
            }, {
              "type": "folder",
              "title": "世界音樂/民樂/傳統戲曲/說唱藝術",
              "icon": "fa fa-folder-open-o",
              "uri": "streetvoice/7"
            }]
          }
        ]
      }
    };
  }

  const pageId = uri.split('/')[1];
  const page = 'https://streetvoice.com/music/charts/' + pageId + '/';
  const playlist = await getPlaylist(page);
  return {
    "navigation": {
      "prev": {
        "uri": "streetvoice"
      },
      "lists": [
        {
          "availableListViews": ["list","grid"],
          "items": playlist.map(song => ({
            "service": "streetvoice",
            "type": "song",
            "title": song.name,
            "artist": song.artist,
            "uri": song.href
          }))
        }
      ]
    }
  };
});



// Define a method to clear, add, and play an array of tracks
streetvoice.prototype.clearAddPlayTrack = volumiofy(async function(track) {
  this.logger.info('[streetvoice] clearAddPlayTrack');
  this.logger.info('[streetvoice] track:' + JSON.stringify(track));
  player.play(track.uri);
});

streetvoice.prototype.seek = volumiofy(async function (position_ms) {
  this.logger.info('[' + Date.now() + '] ' + 'streetvoice::seek to ' + position_ms);
  player.seek(Math.round(position_ms / 1000));
  this.state.seek = position_ms;
  this.pushState();
});

// Stop
streetvoice.prototype.stop = volumiofy(function() {
  const self = this;
  this.logger.info('[' + Date.now() + '] ' + 'streetvoice::stop');
  player.stop();
});

// Pause
streetvoice.prototype.pause = volumiofy(function() {
  const self = this;
  this.logger.info('[' + Date.now() + '] ' + 'streetvoice::pause');
  player.pause();
});

// Pause
streetvoice.prototype.resume = volumiofy(function() {
  const self = this;
  this.logger.info('[' + Date.now() + '] ' + 'streetvoice::resume');
  player.resume();
});

// Get state
streetvoice.prototype.getState = volumiofy(function() {
  const self = this;
  this.logger.info('[' + Date.now() + '] ' + 'streetvoice::getState');

  return this.state;
});

//Parse state
streetvoice.prototype.parseState = function(sState) {
  const self = this;
  this.logger.info('[' + Date.now() + '] ' + 'streetvoice::parseState');

  //Use this method to parse the state and eventually send it with the following function
};

// Announce updated State
streetvoice.prototype.pushState = volumiofy(function(state) {
  const self = this;
  this.logger.info('[' + Date.now() + '] ' + 'streetvoice::pushState');

  return self.commandRouter.servicePushState(self.state, self.servicename);
});


streetvoice.prototype.explodeUri = volumiofy(async function(uri) {
  // Mandatory: retrieve all info for a given URI
  const m3u8Url = await convertSongUrlToM3u8Url(uri);
  const m3u8Info = await getM3u8Info(m3u8Url);
  const duration = Math.round(m3u8Info.segments.reduce((total, segment) => total + segment.duration, 0));
  const trackInfo = await getTrackInfo(uri);

  this.state.uri = m3u8Url;
  this.state.duration = duration;
  this.state.title = trackInfo.songName;
  this.state.artist = trackInfo.artist;
  this.state.albumart = trackInfo.albumArt;
  this.pushState();

  const data = {
    uri: m3u8Url,
    service: 'streetvoice',
    name: trackInfo.songName,
    artist: trackInfo.artist,
    albumart: trackInfo.albumArt,
    type: 'track',
    duration
  };
  this.logger.info('[streetvoice] explode uri result: ' + JSON.stringify(data));
  this.logger.info('[streetvoice] explode uri duration: ' + JSON.stringify(duration));
  return data;
});

streetvoice.prototype.getAlbumArt = volumiofy(function (data, path) {

  let artist, album;

  if (data != undefined && data.path != undefined) {
    path = data.path;
  }

  let web;

  if (data != undefined && data.artist != undefined) {
    artist = data.artist;
    if (data.album != undefined)
      album = data.album;
    else album = data.artist;

    web = '?web=' + nodetools.urlEncode(artist) + '/' + nodetools.urlEncode(album) + '/large'
  }

  const url = '/albumart';

  if (web != undefined)
    url = url + web;

  if (web != undefined && path != undefined)
    url = url + '&';
  else if (path != undefined)
    url = url + '?';

  if (path != undefined)
    url = url + 'path=' + nodetools.urlEncode(path);

  return url;
});

streetvoice.prototype.search = volumiofy(async function (query) {
  // Mandatory, search. You can divide the search in sections using following functions
  this.logger.info('[streetvoice] search for: ' + JSON.stringify(query));
  const searchedSongs = await searchForSongs(query.value, this.logger);
  this.logger.info('[streetvoice] search result: ' + JSON.stringify(searchedSongs));
  return [{
    "type": "title",
    "title": "StreetVoice Tracks",
    "availableListViews": ["list", "grid"],
    "items": searchedSongs.map(song => ({
      "service": "streetvoice",
      "type": "song",
      "title": song.title,
      "artist": song.artist,
      "albumart": song.albumArt,
      "uri": song.uri
    }))
  }];
});

function volumiofy(fn) {
  return function(...args) {
    return libQ.resolve(fn.apply(this, args))
  };
}
