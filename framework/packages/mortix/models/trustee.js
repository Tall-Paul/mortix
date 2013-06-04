exports.definition = function(sequelize,Datatypes){
	return sequelize.define("mortix_user", {
    	username: Datatypes.STRING,
    	password_hash: Datatypes.STRING,     	
	},
	{
		classMethods: {
			get_description: function() { return "Used to store user data"},
			get_admin_fields: function() { return Array("id","username") }
		},
		instanceMethods: {
			

			}
	}	
	);
}