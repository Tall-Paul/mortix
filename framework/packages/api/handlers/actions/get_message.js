var framework = require(process.cwd()+'/framework/framework.js');
var sys = require('sys');

exports.run  = function(api){
	framework.models['mortix_message'].find({where: {to: api.request.body.username, app_string: api.request.body.app_string, id: api.request.body.message_id}}).success(function(message){		
		if (message == null)
			api.error("509","message not found");
		else{
			api.encrypt_and_send_response(message.payload);	
		}
		
	});
}

exports.login_required = true;