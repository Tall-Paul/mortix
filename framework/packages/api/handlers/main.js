var framework = require(process.cwd()+'/framework/framework.js');
var sys = require('sys');


var api_callback = function(api){
	var handled = false;	
	try {
		var action = require(process.cwd()+"/framework/packages/api/handlers/actions/"+api.request.body.action+".js");
		action.run(api);
	} catch (e){
		sys.puts(e);
		sys.puts("Error running action");		
		api.error("501","Error running action");
	}
}


exports.handle = function(id,site,request,response){
	var api = new framework.classes['api'](request,response);		
	api.parse_body(api_callback);	
}