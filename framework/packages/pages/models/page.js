
exports.definition = function(sequelize,DataTypes){
	return sequelize.define("pages_page", {
    title: DataTypes.STRING,
    content: DataTypes.TEXT,
    path: DataTypes.STRING, 
    name: DataTypes.STRING,   
  },
  {
		classMethods: {
			get_description: function() { return "Static content"},
			get_admin_fields: function() { return Array("id","path","title"); }
		},
		instanceMethods: {
			

			}
	}	
  );
}

