/*global Module, MM, setInterval */
(function () {
    'use strict';

    Module.register('MMM-Carousel_flic', {
        defaults: {
            //transitionInterval: 10000,
            ignoreModules: [],
            mode: 'global', //global || positional || slides
            top_bar: {enabled: false, ignoreModules: [], overrideTransitionInterval: 10000},
            top_left: {enabled: false, ignoreModules: [], overrideTransitionInterval: 10000},
            top_center: {enabled: false, ignoreModules: [], overrideTransitionInterval: 10000},
            top_right: {enabled: false, ignoreModules: [], overrideTransitionInterval: 10000},
            upper_third: {enabled: false, ignoreModules: [], overrideTransitionInterval: 10000},
            middle_center: {enabled: false, ignoreModules: [], overrideTransitionInterval: 10000},
            lower_third: {enabled: false, ignoreModules: [], overrideTransitionInterval: 10000},
            bottom_left: {enabled: false, ignoreModules: [], overrideTransitionInterval: 10000},
            bottom_center: {enabled: false, ignoreModules: [], overrideTransitionInterval: 10000},
            bottom_right: {enabled: false, ignoreModules: [], overrideTransitionInterval: 10000},
            bottom_bar: {enabled: false, ignoreModules: [], overrideTransitionInterval: 10000},
            slides: [
                []
            ]
        },
      	start: function(){
    		this.sendSocketNotification("mm","mm");
    		var self = this;
    		document.onkeyup = function(e){
    			if(e.key=="c"){
    				self.moduleTransition.call(self.modules);
    			}
    		};
       	},
      	notificationReceived: function (notification) {
            var position, positions = ['top_bar', 'bottom_bar', 'top_left', 'bottom_left', 'top_center', 'bottom_center', 'top_right', 'bottom_right', 'upper_third', 'middle_center', 'lower_third'];
            if (notification === 'DOM_OBJECTS_CREATED') {
                // Initially, all modules are hidden except the first and any ignored modules
                // We start by getting a list of all of the modules in the transition cycle
                if ((this.config.mode === 'global') || (this.config.mode === 'slides')) {
                    this.setUpTransitionTimers(null);
                } else {
                    for (position = 0; position < positions.length; position += 1) {
                        if (this.config[positions[position]].enabled === true) {
                            this.setUpTransitionTimers(positions[position]);
                        }
                    }
                }
            }
        },
        modules:null,

        setUpTransitionTimers: function (positionIndex) {
            //var timer = this.config.transitionInterval;
            this.modules = MM.getModules().exceptModule(this).filter(function (module) {
                if (positionIndex === null) {
                    return this.config.ignoreModules.indexOf(module.name) === -1;
                }
                return ((this.config[positionIndex].ignoreModules.indexOf(module.name) === -1) && (module.data.position === positionIndex));
            }, this);

            if (this.config.mode === 'slides') {
                this.modules.slides = this.config.slides;
            }

            this.modules.currentIndex = -1;
            this.moduleTransition.call(this.modules);
            //this.moduleTransition.bind(this.modules);
            // We set a timer to cause the page transitions
            //this.transitionTimer = setInterval(this.moduleTransition.bind(modules), timer);
        }, 
  		socketNotificationReceived: function(notification, payload) {
  			if (notification=="ButtonUp"){
  				this.moduleTransition.call(this.modules);
  			}
        	
        },

        moduleTransition: function () {
            var i, resetCurrentIndex = this.length;
            if (this.slides !== undefined) {
                resetCurrentIndex = this.slides.length;
            }
            // Update the current index
            this.currentIndex += 1;
            if (this.currentIndex >= resetCurrentIndex) {
                this.currentIndex = 0;
            }

            for (i = 0; i < this.length; i += 1) {
                // There is currently no easy way to discover whether a module is ALREADY shown/hidden
                // In testing, calling show/hide twice seems to cause no issues
                if (((this.slides === undefined) && (i === this.currentIndex)) || ((this.slides !== undefined) && (this.slides[this.currentIndex].indexOf(this[i].name) !== -1))) {
                    this[i].show(1500);
                } else {
                    this[i].hide(0);
                }
            }
        }
    });
}());
