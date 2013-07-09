exports.definition = function(sequelize,Datatypes){
	return sequelize.define("mortix_message", {
    	to: Datatypes.STRING,
    	from: Datatypes.STRING,
    	app_string: Datatypes.STRING,
    	meta_data: Datatypes.STRING,
    	payload: Datatypes.TEXT,    	    	
	},
	{
		classMethods: {
			
		},
		instanceMethods: {
			

			}
	}	
	);
}