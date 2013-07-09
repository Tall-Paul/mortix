
username_available = function(){
	$('#key_gen_container').show();
}

username_unavailable = function(){
	alert("unfortunately that username is taken... try again");
}

registration_succeeded = function(){
	$('#registration_message').html("Registration succeeded! click <a href='/login.html'>here</a> to login");
	$('#registration_stuff').hide();
}

registration_failed = function(){
	alert("registration failed :( refresh the page and try again");
}


$(document).ready(function(){

	$("#check_name").click(function(e){
		mortix.check_name($('#username').val());
	});

	$('#do_generation').click(function(e){
		alert("Ready to move that mouse?");
		var keys = mortix.generate_key_pair($('#username').val(),$('#passphrase').val());
		//$('#key_gen_container').hide();
		//$('.public_key_rows').show();
		//$('.private_key_rows').show();		
		$('#private_key').val(keys.privateKeyArmored);
		$('#public_key').val(keys.publicKeyArmored);
		mortix.register($('#username').val(),keys.publicKeyArmored,keys.privateKeyArmored);
		//$('#register_container').show();
	});
});