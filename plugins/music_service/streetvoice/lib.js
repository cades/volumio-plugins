const fetch = require('node-fetch');
const cheerio = require('cheerio');
const m3u8Parser = require('m3u8-parser');

function getPlaylist(url) {
  return fetch(url)
    .then(res => res.text())
    .then(body => cheerio.load(body))
    .then($ => {
      const rows = $('.table-song tr');
      return $(rows)
        .toArray()
        .slice(1)
        .map(row => ({
          name: $('td:nth-child(2) h4 a', row).text(),
          href: $('td:nth-child(2) h4 a', row).attr('href'),
          artist: $('td:nth-child(3) a', row).text()
        }));
    });
}

function searchForSongs(query) {
  return fetch('https://streetvoice.com/search/?type=song&q=' + encodeURIComponent(query))
    .then(res => res.text())
    .then(body => cheerio.load(body))
    .then($ => {
      const blocks = $('#item_box_list > div');
      return $(blocks)
        .toArray()
        .map(block => ({
          title: $('.song-info h4', block).text(),
          uri: $('.song-info h4 a', block).attr('href'),
          artist: $('.song-info h5', block).text(),
          albumArt: $('.img-full', block).text(),
        }));
    });
}

function getTrackInfo(url) {
  return fetch('https://streetvoice.com' + url)
    .then(res => res.text())
    .then(body => cheerio.load(body))
    .then($ => {
      const [songName, artist] = $('title').text().replace(' | StreetVoice', '').split(' - ');
      const albumArt = $('.img-full').attr('src');
      return { songName, artist, albumArt };
    });
}

function extractSongIdFromUrl(url) {
  const [_, catptured] = url.match(/\/songs\/(.*)\//);
  return catptured;
}

function convertSongUrlToM3u8Url(url) {
  const songId = extractSongIdFromUrl(url);
  return fetch('https://streetvoice.com/api/v3/songs/' + songId + '/hls/', { method: 'POST' })
    .then(res => res.json())
    .then(data => data.file);
}

async function getM3u8Info(url) {
  const manifest = await fetch(url).then(res => res.text());
  const parser = new m3u8Parser.Parser();

  parser.push(manifest);
  parser.end();

  return parser.manifest;
}

module.exports = {
  getPlaylist,
  extractSongIdFromUrl,
  convertSongUrlToM3u8Url,
  getM3u8Info,
  getTrackInfo,
  searchForSongs
};
