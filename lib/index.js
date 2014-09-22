var Q = require('q');
var _ = require('lodash');
var config = require('../config');
var graphite = require('graphite');
var sensor = require('ds18x20');

var graphiteClient = graphite.createClient("plaintext://"+config.graphiteHost);
var temperaturePollingInterval = config.temperaturePollingInterval;
var intervalHandle = null;

function startPollingTemperature(){
    if(intervalHandle === null){
	intervalHandle = setInterval(pollAndRecordTemperature, temperaturePollingInterval);
	pollAndRecordTemperature();
    }
}

function stopPollingTemperature(){
    if(intervalHandle !== null){
	clearInterval(intervalHandle);
	intervalHandle = null;
    }
}

function pollAndRecordTemperature(){
    readTemperatures()
	.then(recordTemperatures)
	.done();
}

function readTemperatures(){
    return Q.ninvoke(sensor, "getAll")
	.then(function(temperaturesByDeviceId){
	    return convertTemperaturesToUnits(temperaturesByDeviceId, (config.fahrenheit ? "fahrenheit" : "celsius"));
	});
}

function recordTemperatures(temperaturesByDeviceIds){
    var temperaturesByDeviceAlias = convertTemperatureMapKeysToDeviceAliases(temperaturesByDeviceIds);

    _.map(temperaturesByDeviceAlias, function(temperature, deviceAlias){
	console.log(deviceAlias+": "+temperature+(config.fahrenheit ? "\u00B0F" : "\u00B0C"));	
    });

    var metricsObject = {};
    metricsObject[config.graphiteKey] = temperaturesByDeviceAlias;
    graphiteClient.write(metricsObject, function(err){
	if(err != null){
	    console.warn("failed to write metrics to graphite", err);
	}
    });
}

function convertTemperatureMapKeysToDeviceAliases(temperaturesByDeviceId){
    var temperaturePairsWithDeviceIds = _.pairs(temperaturesByDeviceId);
    var temperaturePairsWithDeviceAliases = _.map(temperaturePairsWithDeviceIds, function(pair_){
	var pair = _.clone(pair_);
	var deviceId = pair[0];
	var alias = config.sensorAliases[deviceId];
	if(typeof alias != 'undefined'){
	    pair[0] = alias;
	}
	return pair;
    });
    return _.zipObject(temperaturePairsWithDeviceAliases);
}

function convertTemperaturesToUnits(tempMap, desiredUnit){
    switch(desiredUnit){
    case 'fahrenheit':
	return _.mapValues(tempMap, function(celsiusTemp){
	    return celsiusTemp / 5 * 9 + 32;
	});
    case 'celsius':
	return tempMap;
    default:
	throw new Error("unrecognized temperature unit "+desiredUnit);
    }
}

function main(){
    Q.ninvoke(sensor, "isDriverLoaded")
	.then(function(isLoaded){
	    if(!isLoaded){
		throw new Error("Enable kernel modules with \"sudo modprobe w1-gpio && sudo modprobe w1-therm\", then start this program again.");
	    }
	})
	.then(function(){
	    startPollingTemperature();
	})
	.fail(function(err){
	    console.error("Unable to temperature", err.message);
	});
}

main();