var request = require('pr-request2');
var config = require('../config');
var Q = require('q');
var _ = require('lodash');

module.exports = {
    readTemperature: readTemperature
};

function readTemperature(sensorConfig){
    var stationId = sensorConfig.address;
    var url = "http://stationdata.wunderground.com/cgi-bin/stationlookup?format=json&station="+stationId+"&units=english&v=2.0";
    return request({ url: url, json: true })
	.then(function(response){
	    var temperature = response.body.stations[stationId].temperature;
	    if(config.fahrenheit){
		return temperature;
	    } else {
		return fahrenheitToCelsius(temperature);
	    }
	})
	.then(function(temperature){
	    return _.extend({ temperature: temperature }, sensorConfig);
	});
}

function fahrenheitToCelsius(fahrenheitTemp){
    return (fahrenheitTemp - 32) / 9 * 5;
}