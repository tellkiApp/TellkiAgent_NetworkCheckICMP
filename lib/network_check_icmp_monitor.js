/**
* This script was developed by Guberni and is part of Tellki's Monitoring Solution
*
* February, 2015
* 
* Version 1.0
*
* DESCRIPTION: Monitor Heartbeat (ICMP) utilization
*
* SYNTAX: node network_check_icmp_monitor.js <HOST> <METRIC_STATE>
* 
* EXAMPLE: node network_check_icmp_monitor.js "10.10.2.5" "1,1"
*
* README:
*		<HOST> Hostname or ip address to check
* 
*		<METRIC_STATE> is generated internally by Tellki and it's only used by Tellki default monitors.
*		1 - metric is on ; 0 - metric is off
**/

//METRICS IDS
var metricStatusId = "54:Status:9";
var metricResponseTimeId = "116:Response Time:4";


// ############# INPUT ###################################

//START
(function() {
	try
	{
		monitorInput(process.argv.slice(2));
	}
	catch(err)
	{	
		if(err instanceof InvalidParametersNumberError)
		{
			console.log(err.message);
			process.exit(err.code);
		}
		else
		{
			console.log(err.message);
			process.exit(1);
		}
	}
}).call(this)


/*
* Verify number of passed arguments into the script.
*/
function monitorInput(args)
{

	if(args.length != 2)
	{
		throw new InvalidParametersNumberError()
	}		

	monitorInputProcess(args);
}


/*
* Process the passed arguments and send them to monitor execution (monitorICMP)
* Receive: arguments to be processed
*/
function monitorInputProcess(args)
{
	//<HOST> 
	var host = args[0];
	
	//<METRIC_STATE>
	var metricState = args[1].split(",");
	
	var metricsExecution = new Array(2);
	
	for(var i in metricState)
	{
		metricsExecution[i] = (metricState[i] === "1")
	}

	//create request object to be executed
	var request = new Object();
	request.host = host;
	request.metricsExecution = metricsExecution;
	
	//call monitor
	monitorICMP(request);

}



// ################# ICMP CHECK ###########################
/*
* Retrieve metrics information
* Receive: object request containing configuration
*/
function monitorICMP(request) 
{
	var start = Date.now();
	
	//request ping
	probe(request.host, function(isAlive)
	{		
		if(isAlive)
		{
			// output metrics
			processMetricOnSuccess(request, start);
		}
		else
		{
			// output status set to 0
			processMetricOnError(request, start);
		}
	})
}



//################### OUTPUT METRICS ###########################
/*
* Send metrics to console
* Receive: metrics list to output
*/
function output(metrics)
{
	for(var i in metrics)
	{
		var out = "";
		var metric = metrics[i];
		
		out += metric.id;
		out += "|";
		out += metric.val
		out += "|";
		
		console.log(out);
	}
}

/*
* Process metrics on error.
* Receive:
* - object request to output info 
* - start time, to calculate execution time
*/
function processMetricOnError(request, start)
{
	var metrics = [];
	
	if(request.metricsExecution[0])
	{
		var metric = new Object();
		metric.id = metricStatusId;
		metric.val = 0;
		metric.ts = start;
		metric.exec = Date.now() - start;

		metrics.push(metric);
	}

	output(metrics);
	
}

/*
* process metrics on success
* Receive: 
* - object request to output info
* - start time, to calculate execution time and response time
*/
function processMetricOnSuccess(request, start)
{
	var metrics = [];
	
	if(request.metricsExecution[0])
	{
		var metric = new Object();
		metric.id = metricStatusId;
		metric.val = 1;
		metric.ts = start;
		metric.exec = Date.now() - start;

		metrics.push(metric);
	}
	
	if(request.metricsExecution[1])
	{
		var metric = new Object();
		metric.id = metricResponseTimeId;
		metric.val = Date.now() - start;
		metric.ts = start;
		metric.exec = Date.now() - start;

		metrics.push(metric);
	}
	
	output(metrics);
}



// ##################### UTILS #####################

/**
* LICENSE MIT
* (C) Daniel Zelisko
* http://github.com/danielzzz/node-ping
*
* a simple wrapper for ping
* Now with support of not only english Windows.
*
*/
function probe(addr, cb) {

	var sys = require('util'),
    cp = require('child_process'),
    os = require('os');

	var p = os.platform();
	var ls = null;
	var outstring = "";
	
	if (p === 'linux') {
		//linux
		ls = cp.spawn('/bin/ping', ['-n', '-w 2', '-c 1', addr]);
	} else if (p.match(/^win/)) {
		//windows
		ls = cp.spawn('C:/windows/system32/ping.exe', ['-n', '1', '-w', '5000', addr]);
	} else if (p === 'darwin') {
		//mac osx
		ls = cp.spawn('/sbin/ping', ['-n', '-t 2', '-c 1', addr]);
	}

	ls.on('error', function (e) {
		var err = new Error('ping.probe: there was an error while executing the ping program. check the path or permissions...');
		cb(null, err);
	});


	ls.stdout.on('data', function (data) {
		outstring += String(data);
	});

	ls.stderr.on('data', function (data) {
	  //sys.print('stderr: ' + data);
	});

	ls.on('exit', function (code) {
		var result;
		// workaround for windows machines
		// if host is unreachable ping will return
		// a successfull error code
		// so we need to handle this ourself
		
		if (p.match(/^win/)) {

			var lines = outstring.split('\n');
			result  = false;
			for (var t = 0; t < lines.length; t++) {
				if (lines[t].search(/time[<|>|=]/i) > 0) {
					result	= true;
					break;
				}
			}
		} else {
			result = (code === 0) ? true : false;
		}

		if (cb) {
			cb(result, null);
		}
	});
}



//####################### EXCEPTIONS ################################

//All exceptions used in script

function InvalidParametersNumberError() {
    this.name = "InvalidParametersNumberError";
    this.message = "Wrong number of parameters.";
	this.code = 3;
}
InvalidParametersNumberError.prototype = Object.create(Error.prototype);
InvalidParametersNumberError.prototype.constructor = InvalidParametersNumberError;




