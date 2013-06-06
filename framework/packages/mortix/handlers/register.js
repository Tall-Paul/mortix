var framework = require(process.cwd()+'/framework/framework.js');
var sys = require('sys');
var url = require("url");

exports.handle = function(id,site,request,response){
	if (request.method == 'POST'){
	} else {
		response.writeHeader(200);
		framework.parser.display_file(process.cwd()+"/sites/"+site+"/www/views/registration/register.html",response)
	}
}