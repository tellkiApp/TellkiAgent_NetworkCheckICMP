
var metricStatusId = "54:Status:9";
var metricResponseTimeId = "116:Response Time:4";


//####################### EXCEPTIONS ################################

function InvalidParametersNumberError() {
    this.name = "InvalidParametersNumberError";
    this.message = "Wrong number of parameters.";
	this.code = 3;
}
InvalidParametersNumberError.prototype = Object.create(Error.prototype);
InvalidParametersNumberError.prototype.constructor = InvalidParametersNumberError;

function InvalidMetricStateError() {
    this.name = "InvalidMetricStateError";
    this.message = "Metrics and Status length not match";
	this.code = 9;
}
InvalidMetricStateError.prototype = Object.create(Error.prototype);
InvalidMetricStateError.prototype.constructor = InvalidMetricStateError;



// ############# INPUT ###################################

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
		else if(err instanceof InvalidMetricStateError)
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



function monitorInput(args)
{

	if(args.length != 2)
	{
		throw new InvalidParametersNumberError()
	}		

	monitorInputProcess(args);
}



function monitorInputProcess(args)
{
	
	//host
	var host = args[0];
	
	//metric state
	var metricState = args[1].split(",");
	
	var metricsExecution = new Array(2);
	
	if (metricState.length != 2)
	{
		throw new InvalidMetricStateError();
	}
	else
	{
		for(var i in metricState)
		{
			metricsExecution[i] = (metricState[i] === "1")
		}
	}
	
	
	var request = new Object();
	request.host = host;
	request.metricsExecution = metricsExecution;
	
	
	monitorICMP(request);

}




//################### OUTPUT ###########################


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


// ################# MONITOR ###########################

function monitorICMP(request) 
{
	var start = Date.now();
	
	probe(request.host, function(isAlive)
	{		
		if(isAlive)
		{
			processMetricOnSuccess(request, start);
		}
		else
		{
			processMetricOnError(request, start);
		}
	})
}




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
			// below is not working on My Chinese Windows8 64bit
			/*
			for (var t = 0; t < lines.length; t++) {
				if (lines[t].match (/[0-9]:/)) {
					result = (lines[t].indexOf ("=") != -1);
					break;
				}
			}
			*/
		} else {
			result = (code === 0) ? true : false;
		}

		if (cb) {
			cb(result, null);
		}
	});
}

//#####################################################




