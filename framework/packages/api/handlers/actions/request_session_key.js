var framework = require(process.cwd()+'/framework/framework.js');
var sys = require('sys');
var crypto = require('crypto');

var run = function(api){
	framework.models['mortix_user'].find({where: {username: api.request.body.username}}).success(function(user){
				if (user == null)
					api.error("501","Unable to find user");
				else 
					{
						framework.models['mortix_app_instance'].find({where: {user_id: user.id,app_string: api.request.body.app_string}}).success(function(instance){
							if (instance == null){
								//check if application string exists
								framework.models['mortix_app'].find({where: {app_string: api.request.body.app_string}}).success(function(app){
									if (app == null)
										api.error("502","bad app string");
									else {
										crypto.randomBytes(20,function(ex,buf){
											if (ex) 
												api.error("501","unable to generate session key");
											else {
												framework.models['mortix_app_instance'].create({
													user_id: user.id,
													app_string: api.request.body.app_string,
													session_key: buf.toString('hex'), 
												}).success(function(new_instance){
													if (new_instance == null)
														api.error("501","unable to create application instance");
													else {
														api.encrypt_and_send_response({"code": "200", "key": new_instance.session_key});
													}
												});
											}
										});
									}
								});
							} else {
								api.encrypt_and_send_response({"code": "200", "key": instance.session_key});
							}
						});

					}
			});

}

exports.run = run;

exports.login_required = false;