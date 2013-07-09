var framework = require(process.cwd()+'/framework/framework.js');
var sys = require('sys');

exports.run  = function(api){
	framework.models['mortix_user'].find({where: {username: api.request.body.user}}).success(function(user){
		if (user == null){
			sys.puts("can't find "+api.request.body.user);
			api.error("501","unable to find user");
		}else{			
			api.success(user.private_key);
		}
	});
}

exports.login_required = false;