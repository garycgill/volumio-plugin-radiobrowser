'use strict';

var libQ = require('kew');
var vconf = require('v-conf');
var fetch = require('node-fetch');

const RADIOBROWSER_API = 'https://de1.api.radio-browser.info/json';

module.exports = ControllerRadioBrowser;

function ControllerRadioBrowser(context) {
  var self = this;
  self.context = context;
  self.commandRouter = self.context.coreCommand;
  self.logger = self.context.logger;
  self.configManager = self.context.configManager;
}

ControllerRadioBrowser.prototype.onVolumioStart = function() {
  var self = this;
  var configFile = self.commandRouter.pluginManager.getConfigurationFile(self.context, 'config.json');
  self.config = new vconf();
  self.config.loadFile(configFile);
  return libQ.resolve();
};

ControllerRadioBrowser.prototype.onStart = function() {
  var self = this;
  self.mpdPlugin = self.commandRouter.pluginManager.getPlugin('music_service', 'mpd');
  self.addToBrowseSources();
  return libQ.resolve();
};

ControllerRadioBrowser.prototype.onStop = function() {
  var self = this;
  self.commandRouter.volumioRemoveToBrowseSources('RadioBrowser');
  return libQ.resolve();
};

ControllerRadioBrowser.prototype.addToBrowseSources = function() {
  var self = this;
  self.commandRouter.volumioAddToBrowseSources({
    name: 'RadioBrowser',
    uri: 'radiobrowser',
    plugin_type: 'music_service',
    plugin_name: 'radiobrowser',
    albumart: '/albumart?sourceicon=music_service/radiobrowser/radiobrowser.svg'
  });
};

ControllerRadioBrowser.prototype.handleBrowseUri = function(curUri) {
  var self = this;
  var defer = libQ.defer();

  if (curUri === 'radiobrowser') {
    defer.resolve({
      navigation: {
        lists: [{
          title: 'RadioBrowser',
          icon: 'fa fa-radio',
          availableListViews: ['list'],
          items: [
            { type: 'item-no-menu', title: 'Top 100 Stations', icon: 'fa fa-star', uri: 'radiobrowser/top100' },
            { type: 'item-no-menu', title: 'Search by Name', icon: 'fa fa-search', uri: 'radiobrowser/search' },
            { type: 'item-no-menu', title: 'Browse by Country', icon: 'fa fa-globe', uri: 'radiobrowser/countries' },
            { type: 'item-no-menu', title: 'Browse by Genre', icon: 'fa fa-music', uri: 'radiobrowser/tags' }
          ]
        }]
      }
    });
  } else if (curUri === 'radiobrowser/top100') {
    self.getTopStations().then(function(result) {
      defer.resolve(result);
    }).fail(function(err) {
      defer.reject(err);
    });
  } else if (curUri === 'radiobrowser/countries') {
    self.getCountries().then(function(result) {
      defer.resolve(result);
    }).fail(function(err) {
      defer.reject(err);
    });
  } else if (curUri === 'radiobrowser/tags') {
    self.getTags().then(function(result) {
      defer.resolve(result);
    }).fail(function(err) {
      defer.reject(err);
    });
  } else if (curUri.startsWith('radiobrowser/country/')) {
    var country = decodeURIComponent(curUri.split('/')[2]);
    self.getStationsByCountry(country).then(function(result) {
      defer.resolve(result);
    }).fail(function(err) {
      defer.reject(err);
    });
  } else if (curUri.startsWith('radiobrowser/tag/')) {
    var tag = decodeURIComponent(curUri.split('/')[2]);
    self.getStationsByTag(tag).then(function(result) {
      defer.resolve(result);
    }).fail(function(err) {
      defer.reject(err);
    });
  } else {
    defer.resolve();
  }

  return defer.promise;
};

ControllerRadioBrowser.prototype.getTopStations = function() {
  var self = this;
  return fetch(RADIOBROWSER_API + '/stations/topclick/100')
    .then(function(res) { return res.json(); })
    .then(function(stations) {
      return self.formatStationList(stations, 'Top 100 Stations');
    });
};

ControllerRadioBrowser.prototype.getCountries = function() {
  return fetch(RADIOBROWSER_API + '/countries')
    .then(function(res) { return res.json(); })
    .then(function(countries) {
      var items = countries
        .filter(function(c) { return c.name && c.stationcount > 0; })
        .sort(function(a, b) { return a.name.localeCompare(b.name); })
        .map(function(c) {
          return {
            type: 'item-no-menu',
            title: c.name + ' (' + c.stationcount + ')',
            icon: 'fa fa-globe',
            uri: 'radiobrowser/country/' + encodeURIComponent(c.name)
          };
        });
      return { navigation: { lists: [{ title: 'Countries', items: items }] } };
    });
};

ControllerRadioBrowser.prototype.getTags = function() {
  return fetch(RADIOBROWSER_API + '/tags?limit=200&order=stationcount&reverse=true')
    .then(function(res) { return res.json(); })
    .then(function(tags) {
      var items = tags
        .filter(function(t) { return t.name && t.stationcount > 10; })
        .map(function(t) {
          return {
            type: 'item-no-menu',
            title: t.name + ' (' + t.stationcount + ')',
            icon: 'fa fa-music',
            uri: 'radiobrowser/tag/' + encodeURIComponent(t.name)
          };
        });
      return { navigation: { lists: [{ title: 'Genres', items: items }] } };
    });
};

ControllerRadioBrowser.prototype.getStationsByCountry = function(country) {
  var self = this;
  return fetch(RADIOBROWSER_API + '/stations/bycountry/' + encodeURIComponent(country) + '?limit=200&order=clickcount&reverse=true')
    .then(function(res) { return res.json(); })
    .then(function(stations) {
      return self.formatStationList(stations, country);
    });
};

ControllerRadioBrowser.prototype.getStationsByTag = function(tag) {
  var self = this;
  return fetch(RADIOBROWSER_API + '/stations/bytag/' + encodeURIComponent(tag) + '?limit=200&order=clickcount&reverse=true')
    .then(function(res) { return res.json(); })
    .then(function(stations) {
      return self.formatStationList(stations, tag);
    });
};

ControllerRadioBrowser.prototype.formatStationList = function(stations, title) {
  var items = stations
    .filter(function(s) { return s.url_resolved && s.name; })
    .map(function(s) {
      return {
        service: 'radiobrowser',
        type: 'mywebradio',
        title: s.name,
        artist: s.country || '',
        album: s.tags || '',
        icon: 'fa fa-radio',
        albumart: s.favicon || '',
        uri: 'radiobrowser/play/' + encodeURIComponent(s.url_resolved)
      };
    });
  return { navigation: { lists: [{ title: title, items: items }] } };
};

ControllerRadioBrowser.prototype.explodeUri = function(data) {
  var self = this;
  var defer = libQ.defer();
  var uri = (typeof data === 'string') ? data : data.uri;
  var url = decodeURIComponent(uri.replace('radiobrowser/play/', ''));
  var result = (typeof data === 'object') ? data : {};
  result.uri = url;
  result.service = 'webradio';
  result.type = 'track';
  if (!result.name && result.title) {
    result.name = result.title;
  }
  if (!result.albumart) {
    result.albumart = '/albumart';
  }
  defer.resolve(result);
  return defer.promise;
};


ControllerRadioBrowser.prototype.getConfigurationFiles = function() {
  return ['config.json'];
};

ControllerRadioBrowser.prototype.getUIConfig = function() {
  var defer = libQ.defer();
  defer.resolve({});
  return defer.promise;
};

ControllerRadioBrowser.prototype.setUIConfig = function(data) {};
ControllerRadioBrowser.prototype.getConf = function(varName) {};
ControllerRadioBrowser.prototype.setConf = function(varName, varValue) {};

ControllerRadioBrowser.prototype.saveConfig = function(data) {
  var self = this;
  self.config.set('enabled', data['enabled']);
  self.commandRouter.pushToastMessage('success', 'RadioBrowser', 'Settings saved');
};

ControllerRadioBrowser.prototype.search = function(query) {
  var self = this;
  var searchTerm = query.value;
  return fetch(RADIOBROWSER_API + '/stations/byname/' + encodeURIComponent(searchTerm) + '?limit=50&order=clickcount&reverse=true')
    .then(function(res) { return res.json(); })
    .then(function(stations) {
      return self.formatStationList(stations, 'Search: ' + searchTerm);
    })
    .then(function(result) {
      return [{
        title: 'RadioBrowser',
        icon: 'fa fa-radio',
        availableListViews: ['list'],
        items: result.navigation.lists[0].items
      }];
    });
};
