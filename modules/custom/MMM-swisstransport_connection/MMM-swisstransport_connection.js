/* Timetable for Trains Module */

/* Magic Mirror
 * Module: SwissTransport
 *
 * By Benjamin Angst http://www.beny.ch
 * based on a Script from Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

Module.register("MMM-swisstransport_connection",{

	// Define module defaults
	defaults: {
		maximumEntries: 10, // Total Maximum Entries
		updateInterval: 5 * 60 * 1000, // Update every 5 minutes.
		animationSpeed: 2000,
		fade: true,
		fadePoint: 0.25, // Start on 1/4th of the list.
                initialLoadDelay: 0, // start delay seconds.
		
                apiBase: 'http://transport.opendata.ch/v1/connections',
                
		titleReplace: {
			"Zeittabelle ": ""
		},
	},

	// Define required scripts.
	getStyles: function() {
		return ["swisstransport.css", "font-awesome.css"];
	},

	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(config.language);

                this.trains = [];
		this.loaded = false;
		this.scheduleUpdate(this.config.initialLoadDelay);

		this.updateTimer = null;

	},    
    
	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		if (this.config.id === "") {
			wrapper.innerHTML = "Please set the correct Station ID: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (!this.loaded) {
			wrapper.innerHTML = "Loading trains ...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		var table = document.createElement("table");
		table.className = "swisstransport";
		table.className = "small";
		
		
		for (var c in this.connections) {
			var connection = this.connections[c];


			var row = document.createElement("tr");
			table.appendChild(row);

			
			
			/*
        	if(trains.delay) {
                            var delayCell = document.createElement("td");
                            delayCell.className = "delay red";
                            delayCell.innerHTML = "+" + trains.delay + " min";
                            row.appendChild(delayCell);
            } else {
                            var delayCell = document.createElement("td");
                            delayCell.className = "delay red";
                            delayCell.innerHTML = trains.delay;
                            row.appendChild(delayCell);
            }
            */
			
			
			var trainFromDepCell = document.createElement("td");
			trainFromDepCell.innerHTML = connection.fromdeparture+" - "+connection.toarrival;
			trainFromDepCell.className = "bright";
			row.appendChild(trainFromDepCell);
			
			var depCell = document.createElement("td");
			depCell.className = "duration";
			depCell.innerHTML = connection.duration;
			depCell.className = "bright";
			row.appendChild(depCell);


			for(var s in connection.sections){
				var rowForSections = document.createElement("tr");
				table.appendChild(rowForSections);
				rowForSections.appendChild(document.createElement("td"));
				var sCell = document.createElement("td");
				sCell.innerHTML = connection.sections[s];
				sCell.className = "bright xsmall";
				rowForSections.appendChild(sCell);
			}
			
			/*
			if (this.config.fade && this.config.fadePoint < 1) {
				if (this.config.fadePoint < 0) {
					this.config.fadePoint = 0;
				}
				var startingPoint = this.connections.length * this.config.fadePoint;
				var steps = this.connections.length - startingPoint;
				if (c >= startingPoint) {
					var currentStep = c - startingPoint;
					row.style.opacity = 1 - (1 / steps * currentStep);
					rowForSections.style.opacity = 1 - (1 / steps * currentStep);
				}
			}
			*/

		}

		return table;
	},

	/* updateTimetable(compliments)
	 * Requests new data from openweather.org.
	 * Calls processTrains on succesfull response.
	 */
	updateTimetable: function() {
		var url = this.config.apiBase + this.getParams();
		var self = this;
		var retry = true;

		var trainRequest = new XMLHttpRequest();
		trainRequest.open("GET", url, true);
		trainRequest.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status === 200) {
					self.processConnections(JSON.parse(this.response));
				} else if (this.status === 401) {
					self.config.id = "";
					self.updateDom(self.config.animationSpeed);

					Log.error(self.name + ": Incorrect waht so ever...");
					retry = false;
				} else {
					Log.error(self.name + ": Could not load trains.");
				}

				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		trainRequest.send();
	},

	/* getParams(compliments)
	 * Generates an url with api parameters based on the config.
	 *
	 * return String - URL params.
	 */
	getParams: function() {
		var params = "?";
        params += "from=" + this.config.from;
        params += "&to=" + this.config.to;
		params += "&limit=" + this.config.maximumEntries;
                
		return params;
	},

	/* processTrains(data)
	 * Uses the received data to set the various values.
	 *
	 * argument data object - Weather information received form openweather.org.
	 */
	processConnections: function(data) {
	
		this.connections = [];
		for (var i = 0, count = data.connections.length; i < count; i++) {

			var connection = data.connections[i];
			
			var sections = []
			// Handle sections
			for(var s in connection.sections){
				var section = connection.sections[s];
				if (section.journey == null){
					continue;
				}
				_content = section.departure.station.name +" ("+section.journey.name+"): "+moment(section.departure.departure).format("HH:mm");
				if (section.departure.delay != null){
					_content += " <font style='color:red'>+ "+section.departure.delay+"min(Dep.)</font>";
				}
				if (section.arrival.delay != null){
					_content += " <font style='color:red'>+ "+section.arrival.delay+"min(Arr.)</font>";
				}
				
				sections.push(_content);
			
				if( s == connection.sections.length-1){
					_c = "";
					if (section.arrival.delay != null){
						_c += "<font style='color:red'>+ "+section.arrival.delay+"min(A)</font> ";
					}
					_c += section.arrival.station.name+" : "+moment(section.arrival.arrival).format("HH:mm");
					sections.push(_c);
				}
			
			}
			_duration = connection.duration.split('d')[1].split(":");
			duration = (_duration[0]=="00") ? _duration[1]+"min " : (_duration[0]%100)+"h "+_duration[1]+"min ";
			
			this.connections.push({
			
				duration: duration,
				//from: connection.from.station.name,
				fromdeparture: moment(connection.from.departure).format('HH:mm'),
				//to: connection.to.station.name,
				toarrival: moment(connection.to.arrival).format('HH:mm'),
				sections: sections
				
				
				
				/*
				departureTimestamp: moment(trains.stop.departureTimestamp * 1000).format("HH:mm"),
				delay: trains.stop.delay,
				name: trains.name,
				to: trains.to
				*/
			});
		}

		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
	},

	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function() {
			self.updateTimetable();
		}, nextLoad);
	},

});
