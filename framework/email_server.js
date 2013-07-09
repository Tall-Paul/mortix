var emailjs = require('emailjs/email');

var email = module.exports = function(username,password,host,ssl,from){
	this.username = username;
	this.password = password;
	this.host = host;
	this.ssl = ssl;
	this.from = from;
	this.server = emailjs.server.connect({
   		user:    this.username, 
   		password: this.password, 
   		host:    this.host, 
   		ssl:     this.ssl,
	});
}

email.prototype = {
	send: function(message){
		message.from = this.from;
		this.server.send(message,function(err, message) { console.log(err || message); });
	}
}