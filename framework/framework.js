var http = require('http');
var https = require('https');
var sys = require('sys');
var fs = require('fs');
var connect = require('connect');
var passport = require('passport');
var router_class = require('./router.js');
var parser_class = require(process.cwd()+'/framework/parser.js');
var Sequelize = null;
var mysql    = null;
var sqlite = null;
var sequelize = null;
var models = Array;
var parser = null;
var router = null;
var objects = [];
var login_handler = "base_login";
var https_port = "443";
var http_port = "80";
var email_class = require('./email_server.js');
var classes = Array;
var openpgp = require ("./openpgp.js").openpgp;
var passphrase = "";
var connection = null;
var standard_redirects = false;

var connect_to_database = function(){
	if (connection.dialect == "sqlite"){
			//sys.puts("using sqllite");
			Sequelize = require('sequelize-sqlite').sequelize
			sqlite    = require('sequelize-sqlite').sqlite
			sequelize = new Sequelize(connection.database, connection.username, connection.password,{
				dialect: "sqlite",
				storage: "/sites/data.db",
				logging: false,
			});
		} else {
			//sys.puts("using MySql");
			Sequelize = require('sequelize-mysql').sequelize;
			mysql = require('sequelize-mysql').mysql;
			sequelize = new Sequelize(connection.database, connection.username, connection.password,{
				dialect: "mysql",
				logging: false,
			});
		}	
		//sys.puts("##### MODELS #####");
		for_all_packages(function(package){
			sync_package_models(package);
		});

}

var for_all_packages = function(callback){
	fs.readdir(process.cwd()+"/framework/packages", function(err, files) {
		files.forEach(function(file){
			callback(file);
		});
	});
}

// models
var sync_model = function(model_file,model_name){
	
	var model = require(model_file);
	if (typeof model.definition === 'function'){
		//sys.puts("model: "+model_name+" loaded from "+model_file);
		models[model_name] = model.definition(sequelize,Sequelize);
		models[model_name].sync();
		models[model_name].prototype = model.extend;
	}
	
}

var sync_package_models = function(package){
	var model_dir = process.cwd()+"/framework/packages/"+package+"/models";
	fs.readdir(model_dir, function(err, files) {
		if (err) return;
		files.forEach(function(file){
			if (file != "initialise.js")
				sync_model(model_dir+"/"+file,package+"_"+file.substring(0,file.length - 3));
		});
		try{
			require(model_dir+"/initialise.js");
		} catch (err) {
			//no model_associations in this package
			//sys.puts("no initialise for "+package);
		}

	});
}

//tags

var load_package_tags = function(package){
	var tag_dir = process.cwd()+"/framework/packages/"+package+"/tags";
	fs.readdir(tag_dir, function(err, files) {
		if (err) return;
		files.forEach(function(file){
			tag_name = package+"_"+file.substring(0,file.length - 3);
			tag_class = require(tag_dir+"/"+file);
			parser.assign(tag_name,tag_class.tag());
		});

	});
}

var cache_package_objects = function(package){
	var object_dir = process.cwd()+"/framework/packages/"+package+"/objects";
	fs.readdir(object_dir, function(err, files) {
		if (err) return;
		files.forEach(function(file){
			object_name = package+"_"+file.substring(0,file.length - 3);
			objects.push(object_name);
		});
	});
}

var load_package_class = function(package){
	try{
		classes[package] = require(process.cwd()+"/framework/packages/"+package+"/class.js"); 
	} catch (err){
		//sys.puts("error loading class for "+package+": "+err);
	}
}

var do_common_assign = function(){
	parser.assign("js_includes","<script src='http://code.jquery.com/jquery-1.9.1.min.js'></script><script src='/js/framework.js'></script>");
	parser.assign("user",false);
	parser.assign("guest",true);
	parser.assign("framework_get_object_ajax",function(obj,id,prefix){
			return client_get_object_ajax(obj,id,prefix);				
	});
	parser.assign("framework_get_object",function(obj,id,prefix){
			return client_get_object(obj,id,prefix);
	});	
}

var client_get_object_ajax = function(obj,id,prefix){
	//query = query_from_commas(text);
	//var prefix = query['prefix'];
	var query = "id="+id;	
	return "<script>$(document).ready(function(){ framework_get_object('"+obj+"','"+query+"','"+prefix+"') })</script>";
}

var client_get_object = function(obj,id,prefix){
	if (parser.view[prefix+"_"+obj] == undefined){
		models[obj].find({where: {"id":id}}).success(function(post){
			parser.assign(prefix+"_"+obj,post);
		});
	}
	return " ";
}

var setLoginHandler = function(new_handler){
	login_handler = new_handler;
}

var isLoggedIn = function(id,site,request,response){
	if (!request.isAuthenticated()){
		//sys.puts("USER IS NOT LOGGED IN via "+login_handler);
		router.call_handler(id-1,site,login_handler,request,response);
		return false;
	} else {
		//sys.puts("USER IS LOGGED IN");
		return true;
	}
}

var redirect = function(request,response,secure,path){
	if (secure == true){
		if (https_port == "443" || standard_redirects == true)
			port = "";
		else 
			port = ":"+https_port;
		protocol = "https://";
	} else {
		if (http_port == "80" || standard_redirects == true)
			port = "";
		else 
			port = ":"+http_port;
		protocol = "http://";
	}
	host = request.headers.host;
	host = host.replace(":"+http_port,"");
	host = host.replace(":"+https_port,"");
	response.writeHead(302, {
  			'Location': protocol + host + port + path  			
	});
	response.end();
}

var require_secure = function(request,response){
	if(!request.connection.encrypted) {
		redirect(request,response,true,request.url);
		return true;
  	}
  	return false;
}

var query_from_commas = function(text){
	var parts = text.split(",");
	obj = {};
	parts.forEach(function(item){
		parts2 = item.split('=');
		obj[parts2[0]] = parts2[1];
	});
	return obj;
}
 exports.client_get_object_ajax = client_get_object_ajax;


exports.startServer =  function(passphrase){
	sys.puts("version_string: 0.1.7");
	var config = JSON.parse(fs.readFileSync("./config_files/server.json"));
	http_port = config.http_port;
	https_port = config.https_port;
	standard_redirects = config.standard_redirects;
	connection = config.database;
	var args = process.argv.splice(2);
	passphrase = args[0];
	var email_config = JSON.parse(fs.readFileSync("./config_files/email.json"));
	email = new email_class(email_config.username,email_config.password,email_config.host,email_config.ssl,email_config.from);


	
	router = new router_class();
	parser = new parser_class();
	
	
	connect_to_database();
	
	
	for_all_packages(function(package){
		load_package_tags(package);		
		cache_package_objects(package);
		load_package_class(package);
	});
	do_common_assign();
	var private_key_text = fs.readFileSync("./config_files/privatekey.asc",{encoding: 'utf8'});
	private_keys = openpgp.read_privateKey(private_key_text);
	private_key = private_keys[0];

	exports.models = models;
	exports.parser = parser;
	exports.router = router;
	exports.email = email;
	exports.objects = objects;
	exports.isLoggedIn = isLoggedIn;	
	exports.setLoginHandler = setLoginHandler;	
	exports.http_port = http_port;
	exports.https_port = https_port;
	exports.require_secure = require_secure;
	exports.redirect = redirect;
	exports.classes = classes;
	exports.encryption = openpgp;
	exports.passphrase = passphrase;



	exports.private_key = private_key;


	var https_options = {
  		key: fs.readFileSync(process.cwd()+"/config_files/mortix-key.pem"),
  		cert: fs.readFileSync(process.cwd()+"/config_files/mortix-cert.pem"),
  		ca: Array(fs.readFileSync(process.cwd()+"/config_files/mortix-ca.pem"),fs.readFileSync(process.cwd()+"/config_files/mortix-intermediate.pem")),
	};

	openpgp.init();
	openpgp.config.debug = false;
	//var keys = pgp.openpgp.generate_key_pair(1,"deicist <deicist@email.com>",56,"blah blah blah");

app = connect()
  //.use(connect.logger('tiny'))
  .use(connect.static('sites/default/www/static'))
  .use(connect.cookieParser())
  .use(connect.session({secret:'hurgleburgle'}))
  .use(passport.initialize())
  .use(passport.session())
  .use(function(req, res){
    router.handle(req,res);
  });

 

  http_server = http.createServer(app).listen(http_port);
  https_server = https.createServer(https_options,app).listen(https_port);

  


sys.puts("server started on "+http_port+" and "+https_port);
};
