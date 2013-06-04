exports.definition = function(sequelize,Datatypes){
return sequelize.define("mortix_audit_entry", {
    	entry_type: Datatypes.STRING
	},
	{
		classMethods: {
			get_description: function() { return "Auditing Entry"},
		},
		instanceMethods: {
			

			}
	}	
	);
}