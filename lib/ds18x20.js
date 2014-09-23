var config = require('../config');
var sensor = require('ds18x20');
var Q = require('q');
var _ = require('lodash');

module.exports = {
    readTemperature: readTemperature,
    listSensors: listSensors,
    sensor: sensor
};

function readTemperature(sensorConfig){
    return Q.ninvoke(sensor, "get", sensorConfig.address)
	.then(function(temperature){
	    if(config.fahrenheit){
		return celsiusToFahrenheit(temperature);
	    } else {
		return temperature;
	    }
	})
	.then(function(temperature){
	    return _.extend({ temperature: temperature }, sensorConfig);
	});
}

function listSensors(){
    return Q.ninvoke(sensor, "list")
	.then(function(sensorIds){
	    return _.map(sensorIds, function(sensorId){
		var sensorConfig = _.find(config.sensors, { address: sensorId });
		if(sensorConfig){
		    return sensorId + " ("+sensorConfig.name+")";
		} else {
		    return sensorId;
		}
	    });
	});
}

function celsiusToFahrenheit(celsiusTemp){
    return celsiusTemp / 5 * 9 + 32;
}