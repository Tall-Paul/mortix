var framework = require(process.cwd()+'/framework/framework.js');
var sys = require('sys');

exports.run = function(api){
	sys.puts(JSON.stringify(api.request.body));
	framework.models['mortix_message'].create({		
		to: api.request.body.to,
		from: api.request.body.username,
		app_string: api.request.body.app_string,
		meta_data: api.request.body.meta,
		payload: api.request.body.encrypted_payload
	}).success(function(message){
		if (message == null)
			api.error("501","unable to post message");
		else
			api.encrypt_and_send_response({"code": "200", "message":"message posted"});
	});
}

exports.login_required = true;