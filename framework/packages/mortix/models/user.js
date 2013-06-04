exports.definition = function(sequelize,Datatypes){
	return sequelize.define("mortix_user", {
    	username: Datatypes.STRING,
    	password_hash: Datatypes.STRING,     	
    	item_limit: Datatypes.INTEGER,
    	expiry: Datatypes.DATE,
	},
	{
		classMethods: {
			get_description: function() { return "Mortix User Data"},
			get_admin_fields: function() { return Array("id","username","expiry") }
		},
		instanceMethods: {
			

			}
	}	
	);
}