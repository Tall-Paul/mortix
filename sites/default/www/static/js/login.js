
var get_message = function(id){
	mortix.get_message(id);
};

var private_key_success = function(private_key){
	mortix.get_session_key($('#username').val(),private_key,$('#passphrase').val());
}

var private_key_failure = function(){
	alert("unable to login");
}

var login_succeeded = function(){
	$('.login_main').remove();
	$('#messaging_main').show();
	$('#send').click(function(e){
			mortix.send_message($('#recipient').val(),"simple_message",$('#message').val());
			$('#send_container').dialog("close");
			$('#recipient').val("");
			$('#message').val("");
	});
	mortix.get_all_messages();
} 

var login_failed = function(){
	alert("unable to login!");
}

var new_message = function(data){
	$('#preview').val(data);
	$('#read_container').dialog({
		width: 570,
		close: function(event,ui){ 
			$('#preview').val("");
		}
	});	
}

var display_message_headers = function(data){	
	$('#inbox').html("");
	for (var i = 0; i < data.length; i++) {	
		var row = "<tr onClick='get_message(\""+data[i].id+"\")'><td>"+data[i].id+"</td><td>"+data[i].from+"</td><td>"+data[i].meta+"</td><td>"+data[i].sent+"</td></tr>";
		$('#inbox').append(row);
	}
}

var private_key_text = "";
	var username = "";

$(document).ready(function(){

$('#refresh_messages').click(function(){
	mortix.get_all_messages();
});



$('#new_message').click(function(){
	$('#send_container').dialog({width:560});
});


	if (mortix.load_session() == true){
		$('#private_key_row').remove();
		$('#username_row').remove();
		$('#login_row').remove();
		$('#unlock_row').show();
		$('#login_message').html("Logged in");
		$('#unlock').click(function(e){
			mortix.get_session_key(mortix.username,mortix.private_key_text,$('#passphrase').val());
		});
		$('#logout').click(function(e){
			mortix.clear_session();
			location.reload();
		});
	} else {
		$('#login').click(function(e){
			mortix.get_private_key($('#username').val());
			//
		});
	}	
});



