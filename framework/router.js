var sys = require("sys");
var fs = require("fs");
var url = require("url");
var path = require("path");
var framework = require(process.cwd()+'/framework/framework.js');

(function() {
  // Define StopIteration as part of the global scope if it
  // isn't already defined.
  if(typeof StopIteration == "undefined") {
    StopIteration = new Error("StopIteration");
  }

  // The original version of Array.prototype.forEach.
  var oldForEach = Array.prototype.forEach;

  // If forEach actually exists, define forEach so you can
  // break out of it by throwing StopIteration.  Allow
  // other errors will be thrown as normal.
  if(oldForEach) {
    Array.prototype.forEach = function() {
      try {
        oldForEach.apply(this, [].slice.call(arguments, 0));
      }
      catch(e) {
        if(e !== StopIteration) {
          throw e;
        }
      }
    };
  }
})();


if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
  	if (str == "*")
  		return true;
    return this.slice(0, str.length) == str;
  };
}

if (typeof String.prototype.endsWith != 'function') {
  String.prototype.endsWith = function (str){
  	if (str == "*")
  		return true;
    return this.slice(-str.length) == str;
  };
}

var inArray = function (needle, haystack) {
    var length = haystack.length;
    for(var i = 0; i < length; i++) {
        if(haystack[i] == needle) return true;
    }
    return false;
}


var router = module.exports = function(){
	this.sitesfile = "./config_files/sites.json";
	this.routesfile = "./config_files/routes.json";	
	this.load_routes();
}


router.prototype = {
	sitesfile: "",
	routesfile: "",
	routes: Array(),
	sites: Array(),
	static_cache: {},

	show_routes:  function(){
		this.routes.forEach(function(route){
			sys.puts("id: ["+route.id+"] site: ["+route.site+"] startswith: ["+route.startswith+"] endswith: ["+route.endswith+"] handler: ["+route.handler+"] secure?: ["+route.secure+"]");
		});
	},

	load_sites: function(){
		that = this;
		fs.readFile(this.sitesfile,function(err,data){
			if (err){
				return sys.puts("unable to parse sites file");
			}
			that.sites = JSON.parse(data);
		});		
	},

	load_routes: function(){
		sites = Array();
		var that = this;
		fs.readFile(this.routesfile,function(err,data){
			if (err) {
				return sys.puts("Unable to build routes!!");
			}
			that.routes = JSON.parse(data);
			for (var i = 0; i < that.routes.length; i++) {
				that.routes[i].id = i+1;
				if (typeof that.routes[i].site === "undefined")
					that.routes[i].site = "default";
				if (typeof that.routes[i].startswith === "undefined")
					that.routes[i].startswith = "*";
				if (typeof that.routes[i].endswith === "undefined")
					that.routes[i].endswith = "*";
				if (typeof that.routes[i].secure === "undefined")
					that.routes[i].secure = false;
			}
			//sys.puts("Routes Built from "+that.routesfile);
			sys.puts("##### ROUTES #####");
			that.show_routes();
		});
	},

	save_routes: function(){
	fs.writeFile(this.routesfile,JSON.stringify(this.routes),function(error){
			if (error){
				return sys.puts("unable to save routes");
			}
			sys.puts("Routes saved");
		});
	},

	add_route:  function(site,startswith, endswith, handler){
		this.routes.push({"site":site,"startswith":startswith,"endswith":endswith,"handler":handler});
		this.show_routes();
	},

	call_handler: function(id,site,handler_name,request,response){
		var parts = handler_name.split("_");
		handler_name = "./packages/"+parts[0]+"/handlers/"+parts[1]+".js";
		var handler = require(handler_name);
		handler.handle(id,site,request,response);
	},

	get_object: function(object_name,query_string,request,response){
		var parts = object_name.split("_");
		object_name = "./packages/"+parts[0]+"/objects/"+parts[1]+".js";
		var object = require(object_name);
		object.search(query_string,request,response);
	},

	next_handler: function(current_id,site,request,response){
		var request_path = url.parse(request.url).pathname;
		if (request_path == "/")
			request_path = "index.html";
		var that = this;
		var matched = false;
		var current_handler = "";
		try {
			this.routes.forEach(function(route){
				if (request_path.startsWith(route.startswith) && request_path.endsWith(route.endswith) && route.id > current_id){
					if (route.secure == true){
						if (framework.require_secure(request,response)){ //we need to redirect to secure url
							matched = true;
							throw StopIteration;							
						}

					}
					current_handler = route.handler;
					that.call_handler(route.id,site,route.handler,request,response);
					matched = true;
					throw StopIteration; //break us out of the loop
				}
			});
			if (matched == false){
				//sys.puts("####Hit 404####");
				this.handle_404(request,response);
			} else {
				//response.end();
				//sys.puts("hit bottom of router loop");
			}
		} catch (err) {
			this.handle_error(request,response,err,current_handler);
		}
	},

	handle_error: function(request,response,error,handler){		
		sys.puts("####### ERROR!! ###########");
		sys.puts("Handler: "+handler);
		sys.puts("Error: "+error);
		sys.puts("###########################");
		try {
			response.writeHeader(500, {"Content-Type": "text/html"});
		} catch (err) {

		}
		var template = process.cwd()+"/sites/"+request.site+"/www/views/500.html";
		framework.parser.display_file(template,response);
	},

	handle_404: function(request,response){
		response.writeHeader(404, {"Content-Type": "text/html"});
		var template = process.cwd()+"/sites/"+request.site+"/www/views/404.html";
		framework.parser.display_file(template,response);
	},

	handle_static: function(full_path,request,response){
		if (path.extname(full_path) == ".html"){
			response.writeHeader(200, {"Content-Type": "text/html"});
			framework.parser.display_file(full_path,response);
		} else {
				that = this;
				fs.readFile(full_path, "binary", function(err, file) {    
                	 if(err) {    
                    	that.handle_error(request,response,err); 
		         	}    
                 	else
		 		 	{  
                    	response.writeHeader(200);    
                    	response.write(file, "binary");    
                    	response.end();  
                 	}          
	     		});	     	
		}
},


	handle: function(request,response){		
		//work out which site we're looking at here
		if (!request.isAuthenticated()){
			framework.parser.view.user = false;
		}		
		//get site		
		//this.sites.forEach(function(site,request){
		//	if (site.domain == )
		//}		
		request.site = "default";
		framework.parser.set_root(process.cwd()+"/sites/"+request.site+"/www/");
		var request_path = url.parse(request.url).pathname;
		if (request_path == "/")
			request_path = "index.html";
		var my_path = "sites/"+request.site+"/www/views/"+request_path;
   		var full_path = path.join(process.cwd(),my_path);
   		var root_path = path.join(process.cwd(),"sites/"+request.site+"/www");
   		if (!full_path.startsWith(root_path)){
   			this.handle_404(request,response);
   			return;
   		}
		var handler = "";
		var that = this;
		//object loader
		//	if (request_path.startsWith("/object/")){ //TODO:  fix query string handling
		//		var obj = request_path.substring(8);
		//		sys.puts(obj);
		//	if (inArray(obj,framework.objects)){ //special handler for this in package/objects
		//		this.get_object(obj,"post_id=1",request,response);
		//	}
		//	else {
		//		framework.models[obj].find(url.parse(request.url,true).query.id).success(function(obje){
		//			response.writeHeader( 200 );
        //			response.write(JSON.stringify(obje));
        //			response.end();
		//		});
		//	}
		//	return;
		//}
		//sys.puts(full_path);
		fs.exists(full_path,function(exists){
			if (exists){
				that.handle_static(full_path,request,response);				  
			} else {
				that.next_handler(0,request.site,request,response);				
			}
		});	
	},

}