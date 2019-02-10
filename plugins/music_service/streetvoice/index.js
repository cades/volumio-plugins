'use strict';

const fs=require('fs-extra');
const config = new (require('v-conf'))();
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;

module.exports = streetvoice;
function streetvoice(context) {
    this.context = context;
    this.commandRouter = this.context.coreCommand;
    this.logger = this.context.logger;
    this.configManager = this.context.configManager;
}

streetvoice.prototype.onVolumioStart = function() {
    const configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
    this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);

    return Promise.resolve();
}

streetvoice.prototype.onStart = function() {
    this.logger.info('RRRRRRRRRRRRRRRRR start');
    this.addToBrowseSources();
    return Promise.resolve();
};

streetvoice.prototype.onStop = function() {
    this.logger.info('RRRRRRRRRRRRRRRRR stop');
    return new Promise(resolve => {
	// Once the Plugin has successfull stopped, resolve the promise
	resolve();
    });
};

streetvoice.prototype.onRestart = function() {
    // Optional, use if you need it
};


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


streetvoice.prototype.addToBrowseSources = function () {
    // Use this function to add your music service plugin to music sources
    const data = {
	name: 'StreetVoice',
	uri: 'streetvoice',
	plugin_type: 'music_service',
	plugin_name: 'streetvoice',
	albumart: '/albumart?sourceicon=music_service/streetvoice/TypeS.png'
    };
    this.commandRouter.volumioAddToBrowseSources(data);
};

streetvoice.prototype.handleBrowseUri = function (curUri) {
    //self.commandRouter.logger.info(curUri);
    const response;

    return response;
};



// Define a method to clear, add, and play an array of tracks
streetvoice.prototype.clearAddPlayTrack = function(track) {
    const self = this;
    self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'streetvoice::clearAddPlayTrack');

    self.commandRouter.logger.info(JSON.stringify(track));

    return self.sendSpopCommand('uplay', [track.uri]);
};

streetvoice.prototype.seek = function (timepos) {
    this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'streetvoice::seek to ' + timepos);

    return this.sendSpopCommand('seek '+timepos, []);
};

// Stop
streetvoice.prototype.stop = function() {
    const self = this;
    self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'streetvoice::stop');


};

// Spop pause
streetvoice.prototype.pause = function() {
    const self = this;
    self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'streetvoice::pause');


};

// Get state
streetvoice.prototype.getState = function() {
    const self = this;
    self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'streetvoice::getState');


};

//Parse state
streetvoice.prototype.parseState = function(sState) {
    const self = this;
    self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'streetvoice::parseState');

    //Use this method to parse the state and eventually send it with the following function
};

// Announce updated State
streetvoice.prototype.pushState = function(state) {
    const self = this;
    self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'streetvoice::pushState');

    return self.commandRouter.servicePushState(state, self.servicename);
};


streetvoice.prototype.explodeUri = function(uri) {
    // Mandatory: retrieve all info for a given URI
    return new Promise();
};

streetvoice.prototype.getAlbumArt = function (data, path) {

    const artist, album;

    if (data != undefined && data.path != undefined) {
	path = data.path;
    }

    const web;

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
};





streetvoice.prototype.search = function (query) {
    // Mandatory, search. You can divide the search in sections using following functions
    return new Promise();
};

streetvoice.prototype._searchArtists = function (results) {

};

streetvoice.prototype._searchAlbums = function (results) {

};

streetvoice.prototype._searchPlaylists = function (results) {


};

streetvoice.prototype._searchTracks = function (results) {

};
