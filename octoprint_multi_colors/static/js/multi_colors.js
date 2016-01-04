$(function() {

  function multiColorViewModel(viewModels) {
	var self = this;

	self.loginState = viewModels[0];
	self.printer = viewModels[1];

	self.gcode = ko.observable();
	self.layers = ko.observable();
	self.message = ko.observable();
	self.enabled = ko.observable();
	self.find_string = ko.observable();

	self.NO_FILE = "First, select a GCODE file for printing...";
	
	self.onBeforeBinding = function () {
		self.isAdmin = viewModels[0].isAdmin;
		self.enabled(false);
		self.message(self.NO_FILE);
	}

	self._update = function(file_name){
		if (self.printer.isPrinting() || self.printer.isPaused() ) {
			self.message("Don't use this while printing...");
			self.enabled(false);
		} else {
			if (file_name != null) {
				self.filename = file_name;
				self.message( _.sprintf('Selected file "%(filename)s"', {filename: self.filename}) );
				self.enabled(true);
			} else {
				self.message(self.NO_FILE);
				self.enabled(false);
			}
		}
		
	  }

	self.onTabChange = function(current, previous) {
		if (current == "#tab_plugin_multi_colors") {
			self._sendData({"command":"settings"}, function(data){ self.gcode(data.gcode); self.find_string(data.find_string)});
			self._update(self.printer.filename());
		}
	}

	self.onEventFileDeselected = function(payload) {
		self._update(null);
	}

	self.onEventFileSelected = function(payload) {
		self._update(payload.filename);
	}

  	self._sendData = function(data, callback) {
  		OctoPrint.postJson("api/plugin/multi_colors", data)
  			.done(function(data) {
  				if (callback) callback(data);
  			});
  	};
	 
	self.changeLayers = function(){
		if (self.layers() == undefined || self.layers().trim() == "") {
			showMessageDialog({ title: "Layers please!", message: "Please enter at least on layer where the GCODe should be injected." });
			return;
		} 
		if (self.gcode() == undefined || self.gcode().trim() == "") {
			showMessageDialog({ title: "GCODE please!", message: "Please enter the GCODE to inject." });
			return;
		} 
		if (self.find_string() == undefined || self.find_string().trim() == "") {
			showMessageDialog({ title: "Regex please!", message: "Please enter a valid regex (advanced settings)." });
			return;
		} 
		
		self._sendData({"command":"process", "file":self.filename, "gcode":self.gcode(), "layers":self.layers(),  "find_string":self.find_string().trim() }, 
			function(data){
 				if (data.status) {
					new PNotify({title:"Colors", text:"GCODE injected successfuly", type: "success"});
				} else {
					new PNotify({title:"Colors", text: "Injecting GCODE failed", type: "error"});
				}
			});
	}
}
	
	OCTOPRINT_VIEWMODELS.push([
		multiColorViewModel, 
		["loginStateViewModel", "printerStateViewModel"],
		["#multi_color_layer"]
	]);
	  
});  