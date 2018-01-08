'use strict';

const extend = require('xtend');
const mapboxgl = require('mapbox-gl');
const async = require('async');
const turf = {
    bbox: require('@turf/bbox')
};

const popupTemplate = require('./popup.handlebars');
const moment = require('moment');

/**
 * A NSW OEH Beachwatch Layer for Mapbox GL
 * @class MapboxGLNSWOEHBeachwatch
 *
 * @param {Object} options
 * @param {String} [options.url=https://www.beyondtracks.com/contrib/nsw-oeh-beachwatch.geojson] URL to the NSW OEH Beachwatch feed as processed by https://github.com/beyondtracks/nsw-oeh-beachwatch-geojson
 * @example
 * var nswOEHBeachwatch = new MapboxGLNSWOEHBeachwatch();
 * map.addControl(nswOEHBeachwatch);
 * @return {MapboxGLNSWOEHBeachwatch} `this`
 */
function MapboxGLNSWOEHBeachwatch(options) {
    this.options = extend({}, this.options, options);
}

MapboxGLNSWOEHBeachwatch.prototype = {
    options: {
        url: 'https://www.beyondtracks.com/contrib/nsw-oeh-beachwatch.geojson'
    },

    onAdd: function(map) {
        var self = this;
        this._map = map;
        var el = this.container = document.createElement('div');

        this._map.on('load', function () {
            self._map.addSource('_nswoehbeachwatch', {
                type: 'geojson',
                data: self.options.url
            });

            async.parallel(['likely', 'possible', 'unlikely'].map(function (icon) {
                // async function
                return {
                    key: icon,
                    value: function (callback) {
                        self._map.loadImage('icons/' + icon + '.png', callback)
                    }
                };
            }).reduce(function(acc, cur) {
                acc[cur.key] = cur.value;
                return acc;
            }, {}), function (err, results) {
                for (var icon in results) {
                    self._map.addImage('_nswoehbeachwatch-' + icon, results[icon]);
                }

                self._map.addLayer({
                    id: '_nswoehbeachwatch-symbol',
                    source: '_nswoehbeachwatch',
                    type: 'symbol',
                    layout: {
                        "icon-image": [
                            "match",
                                ["get", "advice"],
                                "likely", '_nswroehbeachwatch-likely',
                                "possible", '_nswoehbeachwatch-possible',
                                "unlikely", '_nswoehbeachwatch-unlikely',
                                '_nswoehbeachwatch-unlikely' // default
                        ],
                        "icon-allow-overlap": true
                    }
                });
            });

            // open popup on click, since we don't want two popups when clicking over both the symbol and fill, we can't limit the on to a specific layer
            self._map.on('click', '_nswoehbeachwatch-symbol', function (e) {
                if (e && e.features && e.features.length) {
                    var feature = e.features[0];

                    var templateData = self._extraTemplateData(feature.properties);

                    new mapboxgl.Popup({
                        closeButton: false, // if true then a bug appears deselecting the feature when closing the popup manually
                        offset: 9
                    })
                        .setLngLat(feature.geometry.coordinates)
                        .setHTML(popupTemplate(templateData))
                        .addTo(self._map);
                }
            });

            // cursor hover pointer
            self._map.on('mouseenter', '_nswoehbeachwatch-symbol', function () {
                map.getCanvas().style.cursor = 'pointer';
            });
            self._map.on('mouseleave', '_nswoehbeachwatch-symbol', function () {
                map.getCanvas().style.cursor = '';
            });
        });

        return el;
    },

    onRemove: function() {
        this.container.parentNode.removeChild(this.container);
        this._map = null;
        return this;
    },

    _extraTemplateData: function (d) {
        d['advice-color'] = adviceToClass(d['advice']);

        d['current-as-of'] = moment(d['pubDate']).calendar(),
        d['current-as-of-ago'] = moment(d['pubDate']).fromNow()

        // units of days only
        d['sample-date'] = moment(d['dateSample']).calendar(),
        d['sample-date-ago'] = moment(d['dateSample']).fromNow()

        return d;
    }
};

/* set bootstrap text class's according to advice level */
function adviceToClass(alertValue) {
    var statusToClass = {
        "likely": "danger",
        "possible": "warning",
        "unlikely": "success"
    };
    if (alertValue in statusToClass) {
        return statusToClass[alertValue];
    } else {
        return 'light';
    }
}

module.exports = MapboxGLNSWOEHBeachwatch;
