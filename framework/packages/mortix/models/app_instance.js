exports.definition = function(sequelize,Datatypes){
	return sequelize.define("mortix_app_instance", {
    	user_id: Datatypes.INTEGER,
    	app_string: Datatypes.STRING,
    	session_key: Datatypes.STRING,    	    	
	},
	{
		classMethods: {
			
		},
		instanceMethods: {
			

			}
	}	
	);
}