var framework = require(process.cwd()+'/framework/framework.js');
var sys = require('sys');

exports.run = function(api){
	framework.models['mortix_user'].find({where: {username: api.request.body.user}}).success(function(user){
		if (user == null){
			api.success("available");
		} else {
			api.success("taken");
		}
	});
}

exports.login_required = false;