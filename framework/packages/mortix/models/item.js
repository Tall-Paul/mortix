exports.definition = function(sequelize,Datatypes){
	return sequelize.define("mortix_item", {
    	name: Datatypes.STRING,
    	data: Datatypes.TEXT,     	    	
	},
	{
		classMethods: {
			get_description: function() { return "Mortix Data"},
			get_admin_fields: function() { return Array("id","name","data") }
		},
		instanceMethods: {
			

			}
	}	
	);
}