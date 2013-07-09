function showMessages(text){
	//alert(text);
}

function _mortix(){
	openpgp.init();
	openpgp.config.debug = false;
	this.app_string = "60c2951c73af1f28d1c755bb7bd5db14f1368844";
	this.mortix_private_key = null;
	this.private_key_text = "";
	this.session_string = null;
	this.server_url = "https://mortix.net/api/";
	this.server_public_key = openpgp.read_publicKey($('#public_key_pre').html());
	this.user_keys = Array();
	this.username = "";

	var generate_key_pair = function(username,passphrase){
		//need to tell the user to waggle their mouse around!!
		return openpgp.generate_key_pair(1, 2048, username, passphrase);
	}

	var set_private_key = function(key_text){
		var local_private_key = openpgp.read_privateKey(key_text);
		if (local_private_key != null){
			this.mortix_private_key = local_private_key[0];
			this.private_key_text = key_text;
		}
	}

	var set_passphrase = function(passphrase){
		this.passphrase = passphrase;
	}

	var decode_private_key = function(passphrase){
		if (this.mortix_private_key)
			return this.mortix_private_key.decryptSecretMPIs(passphrase);
		else
			return false;
	}



	var save_passphrase = function(passphrase){
		sessionStorage.passphrase = passphrase;
	}


	var get_session_key = function(username,key_text,passphrase,callback){
		this.set_private_key(key_text);		
		if (this.decode_private_key(passphrase)){
			$('#public_key').val(this.extract_public_key());
			this.username = username;
			var data = { "username": username, "app_string": this.app_string, "action": "request_session_key"};
			var self = this;
			this.send_to_server(JSON.stringify(data),login);
		} else {
			alert("unable to decode private key, wrong pass phrase?");
			return false;
		}
	}

	var login = function(data,self){	
		if (data.code == "200"){
			self.session_key = data.key;
			self.save_session();
			login_succeeded();
		} else {
			login_failed();
		}
	}

	

	//some of this needs moving into a web worker so it doesn't block the UI
	var send_message = function(username,meta,message_object){
		if (typeof this.user_keys[username] != "undefined"){
			var encrypted_payload = openpgp.write_signed_and_encrypted_message(this.mortix_private_key,this.user_keys[username],JSON.stringify(message_object));
			var data = { "username": this.username, "app_string": this.app_string, "session_key": this.session_key, "action": "post_message","to":username,"meta":meta,"encrypted_payload":encrypted_payload};
			this.send_to_server(JSON.stringify(data),message_response);
		} else {
			var data = { "username": this.username, "app_string": this.app_string, "session_key": this.session_key, "action": "get_public_key","recipient": username};						
			var data_to_send = openpgp.write_signed_and_encrypted_message(this.mortix_private_key,this.server_public_key,JSON.stringify(data));			
			var self = this;
			$.post("/api/",
			{
				encrypted_payload: data_to_send
			},
			function(data){		
				var decoded = self.decode_server_response(data);
				if (typeof decoded == "string")
					data = JSON.parse(decoded);				
				else
					data = decoded;
				if (data.code == "200"){					
					self.user_keys[username] = openpgp.read_publicKey(data.public_key);
					var encrypted_payload = openpgp.write_signed_and_encrypted_message(self.mortix_private_key,self.user_keys[username],JSON.stringify(message_object));
					var message = {};
					var data = { "username": self.username, "app_string": self.app_string, "session_key": self.session_key, "action": "post_message","to":username,"meta":meta,"encrypted_payload":encrypted_payload};
					self.send_to_server(JSON.stringify(data),message_response);
				}
				else{
					alert("didn't get public key: "+JSON.stringify(data));					
				}									
			});
		}
	}

	var message_response = function(data){
		//alert(data);
	}

	
	//######################################### username checking request / response ###################################//
	var check_name = function(username){
		var data = { "user": username, "app_string": this.app_string, "action": "check_username"};
		this.send_to_server(JSON.stringify(data),name_check);
	}

	var name_check = function(data){
		if (data.message == "available"){
			username_available();
		} else {
			username_unavailable();
		}		
	}
	//#######################################################################################################################


	//####################################### registration request / response ##########################################//
	var register = function(username,public_key,private_key){
		var data = { "user": username, "app_string": this.app_string, "action": "register","private_key":private_key,"public_key":public_key};
		this.send_to_server(JSON.stringify(data),register_response);
	}

	var register_response = function(data){
		if (data.message == "registration succeeded"){
			registration_succeeded();
		} else {
			registration_failed();
		}
	}
	//#######################################################################################################################//


	//##########################################get private key request / response ##############################################
	var get_private_key = function(username){
		var data = { "user": username, "app_string": this.app_string, "action": "get_private_key"};
		this.send_to_server(JSON.stringify(data),get_private_key_response);
	}

	var get_private_key_response = function(data){
		if (data.code == "200")
			private_key_success(data.message);
		else
			private_key_failure()
	}

    //#############################################################################################################################


    //##########################################get message headers request / response ############################################

    var get_all_messages = function(){
		var data = { "username": this.username, "app_string": this.app_string, "session_key": this.session_key, "action": "get_message_headers"};
		this.send_to_server(JSON.stringify(data),show_message_headers);
	}

	var show_message_headers = function(data){
		display_message_headers(data);
	}

	//#####################################################################################################################################

	//############################################get message text ##########################################################################
	 var get_message = function(message_id){
	 	 var data = { "username": this.username, "app_string": this.app_string, "session_key": this.session_key, "action": "get_message","message_id": message_id};
	 	 this.send_to_server(JSON.stringify(data),decrypt_message);
	 }

	 //need to run the payload through another decryption
	 var decrypt_message = function(payload,self){
	 	new_message(self.decode_server_response({"encrypted_payload": payload}));
	 }



	var extract_public_key = function(){
		//if (this.load_private_key())
			return this.mortix_private_key.extractPublicKey();
		//else
		//	return false;
	}

	var decode_server_response = function(data){		
		
		if (!data.encrypted_payload){
			return data;
		}
		if (this.mortix_private_key == null){
			return false;
		}
		var msg = openpgp.read_message(data.encrypted_payload);
		var keymat = null;
		var sesskey = null;		
		// Find the private (sub)key for the session key of the message
		for (var i = 0; i< msg[0].sessionKeys.length; i++) {
			if (this.mortix_private_key.privateKeyPacket.publicKey.getKeyId() == msg[0].sessionKeys[i].keyId.bytes) {
					keymat = { key: this.mortix_private_key, keymaterial: this.mortix_private_key.privateKeyPacket};
					sesskey = msg[0].sessionKeys[i];
					break;
			}
			for (var j = 0; j < this.mortix_private_key.subKeys.length; j++) {
					if (this.mortix_private_key.subKeys[j].publicKey.getKeyId() == msg[0].sessionKeys[i].keyId.bytes) {
						keymat = { key: this.mortix_private_key, keymaterial: this.mortix_private_key.subKeys[j]};
						sesskey = msg[0].sessionKeys[i];
						break;
					}
			}
		}
		if (keymat != null) {	
				//alert(sesskey);
				//private key should already be decoded.			
				var payload = msg[0].decrypt(keymat, sesskey);
				return JSON.parse(payload);
		} else {
			return false;
		}
	}

	var decode_and_callback =  function(callback,data){
		var response = this.decode_server_response(data);
		callback(response,this);
	}

	var echo_response = function(data){		
		if (data == false)
			alert("unable to decode response");
		else
			alert(data);
	}

	

	var load_session = function(){
		if (sessionStorage.private_key_text && sessionStorage.private_key_text !== "null"){
			this.private_key_text = sessionStorage.private_key_text;
			this.username = sessionStorage.username;	
			return true;
		} else {
			return false;
		}

	}

	var save_session = function(){
		sessionStorage.private_key_text = this.private_key_text;
		sessionStorage.username = this.username;
	}

	var clear_session = function(){
		sessionStorage.private_key_text = null;
		sessionStorage.username = null;
	}

	

	var send_to_server = function(data,callback){
		//alert(this.mortix_private_key);
		//alert(this.server_public_key);
		var data_to_send = openpgp.write_encrypted_message(this.server_public_key,data);	
		var self = this;	
		$.post(
			this.server_url,
			{encrypted_payload: data_to_send},
			function(data){
				self.decode_and_callback(callback,data);				
			}			
		);
	}


	//this.generate_keys = generate_keys;
	this.set_private_key = set_private_key;
	this.load_session = load_session;	
	this.decode_private_key = decode_private_key;
	this.decode_server_response = decode_server_response;
	this.send_to_server = send_to_server;
	this.save_session = save_session;
	this.decode_and_callback = decode_and_callback;
	this.extract_public_key = extract_public_key;
	this.get_session_key = get_session_key;
	//this.check_passphrase = check_passphrase;
	this.generate_key_pair = generate_key_pair;
	this.login = login;
	this.clear_session = clear_session;
	this.send_message = send_message;
	this.get_all_messages = get_all_messages;
	this.check_name = check_name;
	this.register = register;
	this.get_private_key = get_private_key;
	this.get_message = get_message;
}

var mortix;

$(document).ready(function(){
	mortix = new _mortix();	
});