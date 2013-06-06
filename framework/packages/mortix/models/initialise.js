var framework = require(process.cwd()+'/framework/framework.js');

var sys = require('sys');

//many users to many roles
framework.models['mortix_user'].hasMany(framework.models['mortix_role'], {as: 'roles'});
framework.models['mortix_role'].hasMany(framework.models['mortix_user'], {as: 'users'});

//one user to many items
framework.models['mortix_user'].hasMany(framework.models['mortix_item'], {as: 'databits'});

//one user to many auditing entries
framework.models['mortix_user'].hasMany(framework.models['mortix_audit_entry'], {as: 'entries'});

//one user to many keyholders
framework.models['mortix_user'].hasMany(framework.models['mortix_user'], {as: 'keyholders'});

//set login function
sys.puts("setting login_handler");
framework.setLoginHandler("mortix_login");