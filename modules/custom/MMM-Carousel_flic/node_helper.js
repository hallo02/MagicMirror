var NodeHelper = require('node_helper');

module.exports = NodeHelper.create({
  start: function () {
    console.log('mmm-json-feed helper started...');
    
    var fliclib = require("./fliclibNodeJs");
	var FlicClient = fliclib.FlicClient;
	var FlicConnectionChannel = fliclib.FlicConnectionChannel;
	var FlicScanner = fliclib.FlicScanner;
	var notifier = this;

	var client = new FlicClient("localhost", 5551);

	function listenToButton(bdAddr) {
		console.log("in listentobutton");
		var cc = new FlicConnectionChannel(bdAddr);
		client.addConnectionChannel(cc);
		cc.on("buttonUpOrDown", function(clickType, wasQueued, timeDiff) {
			console.log(bdAddr + " mm  " + clickType + " " + (wasQueued ? "wasQueued" : "notQueued") + " " + timeDiff + " seconds ago");
			if (clickType=="ButtonUp"){
				notifier.sendSocketNotification("ButtonUp",null);
			}
			
		});
		cc.on("connectionStatusChanged", function(connectionStatus, disconnectReason) {
			console.log(bdAddr + " " + connectionStatus + (connectionStatus == "Disconnected" ? " " + disconnectReason : ""));
		});
	}

	client.once("ready", function() {
		console.log("Connected to daemon!");
		client.getInfo(function(info) {
			info.bdAddrOfVerifiedButtons.forEach(function(bdAddr) {
				listenToButton(bdAddr);
			});
		});
	});
  },
  //Subclass socketNotificationReceived received.
  socketNotificationReceived: function(notification, payload) {
    	console.log("Carousel Flic established");
  }

});
