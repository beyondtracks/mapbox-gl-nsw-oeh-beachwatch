'use strict';
var mapboxgl = require('mapbox-gl');
var insertCss = require('insert-css');
var fs = require('fs');
mapboxgl.accessToken = window.localStorage.getItem('MapboxAccessToken');

insertCss(fs.readFileSync('./node_modules/mapbox-gl/dist/mapbox-gl.css', 'utf8'));
insertCss(fs.readFileSync('dist/mapbox-gl-nsw-oeh-beachwatch.css', 'utf8'));

function addCss(fileName) {
    var head = document.head
    var link = document.createElement("link")

    link.type = "text/css"
    link.rel = "stylesheet"
    link.href = fileName

    head.appendChild(link)
}

addCss('./node_modules/bootstrap/dist/css/bootstrap.min.css');
addCss('./node_modules/font-awesome/css/font-awesome.min.css');
addCss('./node_modules/osmic/font/osmic.css');

var MapboxGLNSWOEHBeachwatch = require('./');

var mapDiv = document.body.appendChild(document.createElement('div'));
mapDiv.style.position = 'absolute';
mapDiv.style.top = 0;
mapDiv.style.right = 0;
mapDiv.style.left = 0;
mapDiv.style.bottom = 0;

var map = new mapboxgl.Map({
  container: mapDiv,
  style: 'mapbox://styles/mapbox/streets-v9',
  center: [147, -33],
  zoom: 5,
  hash: true
});
window.map = map;

var nswOEHBeachwatch = new MapboxGLNSWOEHBeachwatch();

window.nswOEHBeachwatch = nswOEHBeachwatch;

map.addControl(nswOEHBeachwatch);
