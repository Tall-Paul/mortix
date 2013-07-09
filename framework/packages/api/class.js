var sys = require("sys");
var qs = require('querystring');
var framework = require(process.cwd()+'/framework/framework.js');

var api = module.exports = function(request,response){
	this.request = request;
	this.response = response;
}

api.prototype = {
	result: function(code,message){
		var obj = {code: code,message:message};
		this.response.writeHeader(200,{"Content-Type": "text/json"});	
		this.response.write(JSON.stringify(obj));
		this.response.end();
	},
	success: function(message){
		this.result("200",message);		
	},
	error: function(code,message){
		this.result(code,message);
	},


	parse_body: function(callback){
		if (this.request.method == 'POST'){
			var body='';
			this.request.on('data', function (data) {
				body +=data;
			});
			var that = this;
			this.request.on('end',function(){
				var parsed_body = qs.parse(body);
				//sys.puts(parsed_body.encrypted_payload);
				if (typeof parsed_body.encrypted_payload != "undefined"){
					//do message decryption
					//sys.puts(parsed_body.encrypted_payload);
					var msg = framework.encryption.read_message(parsed_body.encrypted_payload);
					var keymat = null;
					var sesskey = null;
					// Find the private (sub)key for the session key of the message
					try {
						for (var i = 0; i< msg[0].sessionKeys.length; i++) {
							if (framework.private_key.privateKeyPacket.publicKey.getKeyId() == msg[0].sessionKeys[i].keyId.bytes) {
								keymat = { key: framework.private_key, keymaterial: framework.private_key.privateKeyPacket};
								sesskey = msg[0].sessionKeys[i];
								break;
							}
							for (var j = 0; j < framework.private_key.subKeys.length; j++) {
								if (framework.private_key.subKeys[j].publicKey.getKeyId() == msg[0].sessionKeys[i].keyId.bytes) {
								keymat = { key: framework.private_key, keymaterial: framework.private_key.subKeys[j]};
								sesskey = msg[0].sessionKeys[i];
								break;
							}
							}
						}
					} catch (e) {
						sys.puts("error decrypting message!");
					}
					if (keymat != null) {
						if (!keymat.keymaterial.decryptSecretMPIs(framework.passphrase)) {
							sys.puts("password incorrect");
							that.error("602","Server error");
						}
						var payload = msg[0].decrypt(keymat, sesskey);
						//sys.puts("payload:"+payload);
						that.request.body = JSON.parse(payload);
						if (that.request.body.username){
							framework.models['mortix_user'].find({where: {username: that.request.body.username}}).success(function(user){
								if (user == null)
									that.error("600","User not found");
								else {											
									var public_keys = framework.encryption.read_publicKey(user.public_key);
									user.public_key_decoded = public_keys[0];
									user.public_keys = public_keys;
									that.request.user = user;				
									if (that.request.body.action == "request_session_key"){
										//sys.puts("called request_session_key");
										sys.puts(that.request.body.action);
										callback(that);										
									} else {										
										framework.models['mortix_app_instance'].find({where: {user_id: user.id,app_string: that.request.body.app_string, session_key: that.request.body.session_key}}).success(function(instance){
											if (instance == null){
													//sys.puts("unknown session key");
													that.error("503","Session key not recognised");													
											} else {												
												//sys.puts("doing session key callback");
												sys.puts(that.request.body.action);
												callback(that);
											}

										});
									}			
								}
							});
						} else {
							//no user sent in request... do we need one?  
							if (that.request.body.action){
								//sys.puts(process.cwd()+"/framework/packages/api/handlers/actions/"+that.request.body.action+".js");
								try {
									var action = require(process.cwd()+"/framework/packages/api/handlers/actions/"+that.request.body.action+".js");
									if (action.login_required == true){
									//no user name sent, but action says we need one!
										that.error("508","Login required!");
									} else {
										sys.puts(that.request.body.action);
										callback(that);
									}
								} catch (e){
									that.error("509","unable to service request");
								}
								
							} else {													
								that.error("507","no action or payload supplied in request");
							}
						}
						
					} else {
						that.error("501","Encryption Error");
						//sys.puts("no private key found");
						//callback(that);
					}
				} else {
					that.error("501","Encryption Error");
					//sys.puts("no encrypted payload");
				}				
			});
		} else {
			this.error("501","Wrong method");
		}
	},
	encrypt_and_send_response: function(response){
		if (framework.private_key.decryptSecretMPIs(framework.passphrase)){
			framework.encryption.config.config.integrity_protect = false;
			//sys.puts("Encrypting message"+JSON.stringify(response));

			var data_to_send = framework.encryption.write_signed_and_encrypted_message(framework.private_key,this.request.user.public_keys,JSON.stringify(response));	
			//sys.puts(data_to_send);	
			this.response.writeHeader(200,{"Content-Type": "text/json"});
			this.response.write(JSON.stringify({encrypted_payload:data_to_send}));
			this.response.end();
		} else {
			this.error("501","unable to encrypt response");
		}
	},
}