var framework = require(process.cwd()+'/framework/framework.js');
var sys = require('sys');
var url = require("url");
var qs = require('querystring');
var sha1 = require('sha1');

exports.handle = function(id,site,request,response){
		framework.parser.assign("register_message","Please enter your details:");
		response.writeHeader(200);		
		framework.parser.display_file(process.cwd()+"/sites/"+site+"/www/views/registration/register.html",response);
		return true;
}