var framework = require(process.cwd()+'/framework/framework.js');
var sys = require('sys');
var url = require("url");
var qs = require('querystring');
var sha1 = require('sha1');

exports.handle = function(id,site,request,response){
	if (framework.require_secure(request,response))
		return true;
	if (request.method == 'POST'){
	} else {
		var query = require('url').parse(request.url,true).query
		if (typeof query.join_code == 'undefined')
			framework.parser.assign("joincode","");
		else
			framework.parser.assign("joincode",query.join_code);
		sys.puts("here!");
		response.writeHeader(200);
		framework.parser.display_file(process.cwd()+"/sites/"+site+"/www/views/registration/validate.html",response,false);
	}
}