var framework = require(process.cwd()+'/framework/framework.js');
var sys = require('sys');

exports.run = function(api){
	framework.models['mortix_user'].find({where: {username: api.request.body.username}}).success(function(user){
		if (user != null){
				api.error("501","Username in use");					
		} else {
				framework.models['mortix_user'].create({username: api.request.body.user, public_key: api.request.body.public_key, private_key: api.request.body.private_key}).success(function(user){
				if (user == null){
						api.error("501","Unknown error");
				} else {
						api.success("registration succeeded");
							var message = {
   								text:    "User Registration: "+api.request.body.user, 
   								to:      "tall_paulb@hotmail.com",   		
   								subject: "User Registration",
   								attachment: 
   								[
      								{data:"<html>User: "+api.request.body.user+" just registered</html>", alternative:true},      		
   								]
							};							
						framework.email.send(message);
				}
			});
		}
	});
}

exports.login_required = false;