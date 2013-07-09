exports.definition = function(sequelize,Datatypes){
	return sequelize.define("mortix_user", {
    	public_key: Datatypes.TEXT,
    	private_key: Datatypes.TEXT,
    	username: Datatypes.STRING,    	    	
	},
	{
		classMethods: {
			
		},
		instanceMethods: {
			

			}
	}	
	);
}