Temperature-Graphite
==========================

Read from a DS18*20 temperature sensor connected to a Raspberry Pi's GPIO pins, or from The Weather Underground, and publish the temperature to a Graphite server.

# Parts

## Hardware
- [Raspberry Pi Model B](http://www.amazon.com/RASPBERRY-MODEL-756-8308-Raspberry-Pi/dp/B009SQQF9C)
- [DS18B20 1-wire digital temperature sensor](http://www.adafruit.com/products/374)
- 4.7k ohm resistor
- Breadboard
- Jumper cables (male-female)
- Micro-USB power adapter
- SD card

## Software
- [Raspbian Linux](http://www.raspberrypi.org/downloads/) on the SD card
- [Graphite](http://graphite.wikidot.com/) server, usually on a different machine (have fun setting that up)
- [Node.js for ARM](http://nodejs.org/dist/v0.10.28/node-v0.10.28-linux-arm-pi.tar.gz)

# Installation
1. Wire up the temperature sensor to the Raspberry Pi's GPIO pins (follow [Step 1 of PrivateEyePi's guide](http://www.projects.privateeyepi.com/home/temperature-gauge)).
2. Start the Raspberry Pi and test the wiring:
	- `sudo modprobe w1-gpio`
	- `sudo modprobe w1-therm`
	- `cat /sys/bus/w1/devices/*/w1_slave`
	- This should print some output containing `t=20812` or similar, which represents 20.812 degrees Celsius. Make sure the output contains a reasonable value for the temperature you expect.
3. Set the kernel to automatically load the 1-Wire modules on boot
	1. Edit `/etc/modules` as root
	2. Append `w1-gpio`
	3. Append `w1-therm`
4. Run `npm install` to download Node dependencies.

# Configuration
Copy the provided `config.example.json` to `config.json`.

#### graphiteHost
Hostname and port of the Graphite Carbon server (default port = 2003).

#### graphiteKey
Store all temperature graphs under this carbon parent directory.
For example, with a `graphiteKey` of `temperature` and a sensor with name = `temp0`, the graphite series name would be `temperature.temp0`.

#### temperaturePollingInterval
How often, in milliseconds, to query all sensors for temperature readings. It would probably make sense for this to be the same as your Whisper database retention interval (specified in Graphite's `storage-schemas.conf`).

#### sensors
Array of `sensor` configurations.
Each sensor configuration is an object of the form
```javascript
{
	"name": "my-sensor-name", //used as a Graphite series name
	"type": "ds18*20", //either "ds18*20" for a GPIO 1-wire temperature sensor, or "wunderground" for a wunderground.com API client
	"address": "28-000005aacd47" //for type=ds18*20: the 1-wire ID of the sensor device (list with node index.js --list-sensors). for type=wunderground: the station ID to poll (case-sensitive)
}
```

#### fahrenheit
If `true`, temperature readings will be reported in degrees Fahrenheit, otherwise, they will be reported in degrees Celsius.

# Running
1. Start the program with `node index.js`.

# Installing as a SysV service
1. Copy the included `temperature-graphite` to `/etc/init.d/`.
2. Register the service with `sudo update-rc.d temperature-graphite defaults`.
3. Start the service with `sudo service temperature-graphite start`.
