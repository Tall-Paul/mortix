exports.definition = function(sequelize,Datatypes){
	return sequelize.define("mortix_app", {
    	name: Datatypes.STRING,
    	app_string: Datatypes.STRING,    	    	
	},
	{
		classMethods: {
			
		},
		instanceMethods: {
			

			}
	}	
	);
}