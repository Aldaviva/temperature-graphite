var request = require('pr-request2');
var config = require('../config');
var Q = require('q');
var _ = require('lodash');
var cache = require('./cache');

module.exports = {
    readTemperature: readTemperatureCached
};

function readTemperatureCached(sensorConfig){
    var cacheKey = "wunderground." + sensorConfig.address;
    return cache.wrapPromise(cacheKey, _.partial(readTemperature, sensorConfig));
}

function readTemperature(sensorConfig){
    var stationId = sensorConfig.address;
    var url = "http://stationdata.wunderground.com/cgi-bin/stationlookup?format=json&station="+stationId+"&units=english&v=2.0";
    return request({ url: url, json: true })
	.then(function(response){
	    var station = response.body.stations[stationId];
	    if(station){
		var temperature = station.temperature;
		if(config.fahrenheit){
		    return temperature;
		} else {
		    return fahrenheitToCelsius(temperature);
		}
	    } else {
		throw new Error("wunderground_response_missing_station");
	    }
	})
	.then(function(temperature){
	    return _.extend({ temperature: temperature }, sensorConfig);
	})
	.fail(function(err){
	    if(err.message == 'wunderground_response_missing_station'){
		return null;
	    } else {
		throw err;
	    }
	});
}

function fahrenheitToCelsius(fahrenheitTemp){
    return (fahrenheitTemp - 32) / 9 * 5;
}