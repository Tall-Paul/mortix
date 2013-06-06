var framework = require(process.cwd()+'/framework/framework.js');
var sys = require('sys');
var url = require("url");

exports.handle = function(id,site,request,response){
	if (framework.require_secure(request,response))
		return true;
	if (framework.isLoggedIn(id,site,request,response)){
		framework.parser.display_file(process.cwd()+"/sites/"+site+"/www/views/account/index.html",response);	
	}
}