var Q = require('q');
var _ = require('lodash');
var config = require('../config');
var graphite = require('graphite');

var sensors = {
    "ds18*20": require('./ds18x20'),
    "wunderground": require('./wunderground')
};

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
    return Q.all(_.map(config.sensors, function(sensorConfig){
	var sensor = sensors[sensorConfig.type];
	return sensor.readTemperature(sensorConfig);
    }));
}

function recordTemperatures(sensorData){
    console.log("\n"+new Date());
    _.map(sensorData, function(sensorDatum){
	console.log(sensorDatum.name+": "+sensorDatum.temperature+(config.fahrenheit ? "\u00B0F" : "\u00B0C"));	
    });

    var metricsObject = {};
    metricsObject[config.graphiteKey] = _.zipObject(_.map(sensorData, function(sensorDatum){
	return [sensorDatum.name, sensorDatum.temperature];
    }));
//    console.log("graphite metrics", metricsObject);

    graphiteClient.write(metricsObject, function(err){
	if(err != null){
	    console.warn("failed to write metrics to graphite", err);
	}
    });
}

function main(){
    var ds18x20 = sensors['ds18*20'];
    Q.ninvoke(ds18x20.sensor, "isDriverLoaded")
	.then(function(isLoaded){
	    if(!isLoaded){
		throw new Error("Enable kernel modules with \"sudo modprobe w1-gpio && sudo modprobe w1-therm\", then start this program again.");
	    }
	})
	.then(function(){
	    if(process.argv[2] == '--list-sensors'){
		return ds18x20.listSensors()
		    .then(function(sensorLabels){
			_.map(sensorLabels, function(sensorLabel){
			    console.log(sensorLabel);
			});
		    });
	    } else {
		return startPollingTemperature();
	    }
	})
	.fail(function(err){
	    console.error("Unable to temperature", err.message);
	});
}

main();