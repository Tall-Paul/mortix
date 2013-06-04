exports.definition = function(sequelize,Datatypes){
	return sequelize.define("mortix_role", {
    	name: Datatypes.STRING,    	     	
	},
	{
		classMethods: {
			
		},
		instanceMethods: {
			

			}
	}	
	);
}