#!/bin/sh
# Create Pelican Admin User via Docker
# This script runs inside the Pelican container to create an admin user

set -e

ADMIN_USER="${INIT_ADMIN_USERNAME:-admin}"
ADMIN_PASS="${INIT_ADMIN_PASSWORD:-admin123}"
ADMIN_EMAIL="${PELICAN_ADMIN_EMAIL:-admin@hyfern.us}"

echo "Creating admin user: $ADMIN_USER"

# Run PHP script inside the container
docker compose exec -T pelican-panel php -r "
require '/var/www/html/vendor/autoload.php';

\$app = require_once '/var/www/html/bootstrap/app.php';
\$kernel = \$app->make(Illuminate\Contracts\Console\Kernel::class);
\$kernel->bootstrap();

use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\AdminRole;

// Check if user exists
if (User::where('username', '$ADMIN_USER')->orWhere('email', '$ADMIN_EMAIL')->exists()) {
    echo \"Admin user already exists!\\n\";
    exit(0);
}

// Get admin role
\$role = AdminRole::where('name', 'Administrator')->first();
if (!\$role) {
    echo \"ERROR: Administrator role not found. Is the database initialized?\\n\";
    exit(1);
}

// Create user
\$user = new User();
\$user->name = 'Administrator';
\$user->email = '$ADMIN_EMAIL';
\$user->username = '$ADMIN_USER';
\$user->password = Hash::make('$ADMIN_PASS');
\$user->language = 'en';
\$user->admin_role_id = \$role->id;
\$user->root_admin = true;
\$user->save();

// Assign role
\$user->adminRoles()->attach(\$role->id);

echo \"Admin user created successfully!\\n\";
echo \"Username: $ADMIN_USER\\n\";
echo \"Email: $ADMIN_EMAIL\\n\";
"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Admin user created successfully!"
    echo "You can now login at: https://panel.hyfern.us"
    echo "Username: $ADMIN_USER"
    echo "Password: [hidden]"
else
    echo ""
    echo "❌ Failed to create admin user"
    echo "Make sure the database is initialized by visiting the setup wizard first"
fi
