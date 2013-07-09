var framework = require(process.cwd()+'/framework/framework.js');
var sys = require('sys');

exports.run  = function(api){
	framework.models['mortix_message'].findAll({where: {to: api.request.body.username, app_string: api.request.body.app_string}}).success(function(results){		
		var returnObj = Array();
		for (var i = 0; i < results.length; i++) {
			var row = {id: results[i].id,from: results[i].from,meta: results[i].meta_data,sent: results[i].createdAt};
			returnObj.push(row);
		}
		//sys.puts(JSON.stringify(returnObj));
		api.encrypt_and_send_response(returnObj);
	});
}

exports.login_required = true;