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




var connect_to_database = function(){
	fs.readFile(process.cwd()+"/sites/db.json",function(err,data){
		if (err) {
				//fallback to sqllite
				return sys.puts("Unable to get database connection details");
		}
		sys.puts("##### DATABASE #####");
		var connection = JSON.parse(data);		
		if (connection.dialect == "sqlite"){
			sys.puts("using sqllite");
			Sequelize = require('sequelize-sqlite').sequelize
			sqlite    = require('sequelize-sqlite').sqlite
			sequelize = new Sequelize(connection.database, connection.username, connection.password,{
				dialect: "sqlite",
				storage: "/sites/data.db",
				logging: false,
			});
		} else {
			sys.puts("using MySql");
			Sequelize = require('sequelize-mysql').sequelize;
			mysql = require('sequelize-mysql').mysql;
			sequelize = new Sequelize(connection.database, connection.username, connection.password,{
				dialect: "mysql",
				logging: false,
			});
		}	
		sys.puts("##### MODELS #####");
		for_all_packages(function(package){
			sync_package_models(package);
		});

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
	sys.puts("model:"+model_name);
	var model = require(model_file);
	if (typeof model.definition === 'function'){
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
			sys.puts("no initialise for "+package);
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

		sys.puts("USER IS NOT LOGGED IN via "+login_handler);
		router.call_handler(id-1,site,login_handler,request,response);
		return false;
	} else {
		sys.puts("USER IS LOGGED IN");
		return true;
	}
}


var require_secure = function(request,response){
	if(!request.connection.encrypted) {
		if (https_port == "443")
			port = "";
		else 
			port = ":"+https_port;
		//remove port from current request
		host = request.headers.host;
		host = host.replace(":"+http_port,"");
		response.writeHead(302, {
  			'Location': 'https://' + host + port + request.url  
		});
		response.end();    	
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


exports.startServer =  function(set_http_port,set_https_port){

	if (typeof set_http_port != "undefined")
		http_port = set_http_port;
	if (typeof set_https_port != "undefined")
		https_port = set_https_port;
	
	router = new router_class(process.cwd()+"/sites");
	parser = new parser_class();
	
	connect_to_database();
	
	
	for_all_packages(function(package){
		load_package_tags(package);		
		cache_package_objects(package);
	});
	do_common_assign();


	exports.models = models;
	exports.parser = parser;
	exports.router = router;
	exports.objects = objects;
	exports.isLoggedIn = isLoggedIn;	
	exports.setLoginHandler = setLoginHandler;	
	exports.http_port = http_port;
	exports.https_port = https_port;
	exports.require_secure = require_secure;

	var https_options = {
  		key: fs.readFileSync(process.cwd()+"/framework/key.pem"),
  		cert: fs.readFileSync(process.cwd()+"/framework/cert.pem")
	};

app = connect()
  .use(connect.logger('tiny'))
  .use(connect.static('sites/default/www/static'))
  .use(connect.cookieParser())
  .use(connect.session({secret:'wakajakamadaka'}))
  .use(passport.initialize())
  .use(passport.session())
  .use(function(req, res){
    router.handle(req,res);
  });

 

  http_server = http.createServer(app).listen(http_port);
  https_server = https.createServer(https_options,app).listen(https_port);

  


sys.puts("server started on "+http_port+" and "+https_port);
};
