const path = require('path');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const https = require('https');
const request = require('request');
const fs = require('fs');

let stationsFile = path.join(__dirname, '../agencyInfo/stations.txt');
let routesFile =  path.join(__dirname, '../agencyInfo/routes.txt');

// let vehicles = [];
let tripUpdates = [];
let routes = [];
let stations = [];

let feeds = {
    "ace": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace",
    "bdfm": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm",
    "g": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g",
    "jz": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz",
    "nqrw": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw",
    "l": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l",
    "1234567": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",
    "si": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si"

}

const requestSettings = {
    method: 'GET',
    headers: {
        "x-api-key": 'NaAY1FHNnu7I49kZeb681az1hn7YW4z68zwnnN8X'
    },
    encoding: null
};

setUpStations();
setUpRoutes();
getTripUpdates('ace');

function setUpStations() {
    console.log('Setting up stations');
    fs.readFile(stationsFile, {encoding: 'utf8'}, (err, data) => {
        if (!err) {
            let rawData = CSVToArray(data, ',');
            for (station of rawData) {
                let stationObject = {};
                stationObject.stopId = station[0];
                stationObject.name = station [1];
                stationObject.lines = []
                for (let i = 2; i < station.length; i ++) {
                    stationObject.lines.push(station[i].replace(/\s/g, ''));
                }
                stationObject.lines.sort((a, b) => (a > b) ? 1 : -1);
                stations.push(stationObject);
            }
        } else {
            console.log(err);
        }
    });
}

function setUpRoutes() {
    console.log('Setting up routes');
  fs.readFile(routesFile, {encoding: 'utf8'}, (err, data) => {
    if (!err) {
        let rawData = CSVToArray(data, ',');
        for (route of rawData) {
            let routeObject = {};
            routeObject.routeId = route[1];
            routeObject.routeName = route[2];
            routeObject.routeLongName = route[3];
            routeObject.color = `#${route[7]}`;
            routeObject.textColor = `#${route[8]}`;
            routes.push(routeObject);
        }
    } else {
      console.log(err);
    }
  });
}

function getTripUpdates (service) {
    console.log(`Refreshing trip updates for ${service}`);
    tripUpdates = [];
    requestSettings.url = feeds[service];
    request(requestSettings, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            let gtfsData = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(body);
            for (entity of gtfsData.entity) {
                if (entity.tripUpdate) { tripUpdates.push(entity) }
            }
        }
    });
}

function getStationSchedule(stopId, service) {
    console.log(`Getting ${service} schedule for ${stopId}`);
    let arrivals = [];

    getTripUpdates(service);
    
    for (tripUpdate of tripUpdates) {
            for (stopTimeUpdate of tripUpdate.tripUpdate.stopTimeUpdate) {
                if (stopTimeUpdate.stopId.indexOf(stopId) >= 0){
                    let scheduleItem = {};
                    let tripId = tripUpdate.tripUpdate.trip.tripId;
                    let timeStamp = parseInt(stopTimeUpdate.arrival.time.low) * 1000;
                    let arrivalTime = new Date(timeStamp);
                    let now = Date.now();
                    let minutesUntil = Math.floor((timeStamp - now) / 60000);
                    scheduleItem.tripId = tripId;
                    scheduleItem.arrivalTime = `${arrivalTime.getHours()}:${arrivalTime.getMinutes()}`;
                    scheduleItem.routeId = tripUpdate.tripUpdate.trip.routeId;
                    scheduleItem.minutesUntil = minutesUntil;
                    scheduleItem.direction = tripId.substring(tripId.length - 1, tripId.length);
                    if (scheduleItem.minutesUntil >= 0) {
                        arrivals.push(scheduleItem);
                    }
                }
            }
    }

    arrivals.sort((a, b) => (a.minutesUntil > b.minutesUntil) ? 1 : -1);
    return arrivals;
}

function getVehicleFromTripID (tripId) {
  for (vehicle of vehicles) {
    if (vehicle.trip.tripId.indexOf(tripId) >= 0) {
      return vehicle;
    }
  }
}

function CSVToArray( strData, strDelimiter ){
    strDelimiter = (strDelimiter || ",");
    var objPattern = new RegExp(
        (
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
        );
    var arrData = [[]];
    var arrMatches = null;
    while (arrMatches = objPattern.exec( strData )){
        var strMatchedDelimiter = arrMatches[ 1 ];
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
            ){
            arrData.push( [] );
        }
        var strMatchedValue;
        if (arrMatches[ 2 ]){
            strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
                );
        } else {
            strMatchedValue = arrMatches[ 3 ];
        }
        arrData[ arrData.length - 1 ].push( strMatchedValue );
    }
    return( arrData );
}

exports.tripUpdates = tripUpdates;
exports.routes = routes;
exports.stations = stations;
exports.setUpStations = setUpStations;
exports.setUpRoutes = setUpRoutes;
exports.getTripUpdates = getTripUpdates;
exports.getStationSchedule = getStationSchedule;
exports.getVehicleFromTripID = getVehicleFromTripID;