var framework = require(process.cwd()+'/framework/framework.js');
var sys = require('sys');

exports.run  = function(api){
	framework.models['mortix_user'].find({where: {username: api.request.body.recipient}}).success(function(user){
		if (user == null){
			sys.puts("can't find "+api.request.body.recipient);
			api.error("501","unable to find user");
		}else{			
			api.encrypt_and_send_response({"code": "200", "public_key": user.public_key});
		}
	});
}

exports.login_required = true;