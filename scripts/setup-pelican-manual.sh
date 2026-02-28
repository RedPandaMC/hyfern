#!/bin/sh
# Manual Pelican Setup Script
# Run this once after the containers are running

echo "=========================================="
echo "Manual Pelican Panel Setup"
echo "=========================================="
echo ""
echo "This script will help you complete the Pelican Panel setup."
echo ""

# Check if panel is running
if ! docker ps | grep -q hyfern-pelican-panel; then
    echo "ERROR: Pelican Panel container is not running!"
    echo "Start it first with: docker compose up -d pelican-panel"
    exit 1
fi

echo "Step 1: Access the web installer"
echo "----------------------------------------"
echo "Please open your browser and go to:"
echo "  https://panel.hyfern.us/installer"
echo ""
echo "Follow the setup wizard to complete installation."
echo ""
echo "Step 2: After completing the web setup, run these commands:"
echo "----------------------------------------"
echo ""
echo "docker exec hyfern-pelican-panel php artisan migrate --force"
echo ""
echo "Step 3: Create an admin user (optional):"
echo "----------------------------------------"
echo ""
echo "docker exec hyfern-pelican-panel php artisan make:filament-user"
echo ""
echo "=========================================="
echo "Alternative: Direct Database Setup"
echo "=========================================="
echo ""
echo "If you want to skip the web installer, you can try:"
echo ""
echo "1. Access the container:"
echo "   docker exec -it hyfern-pelican-panel sh"
echo ""
echo "2. Run the environment setup:"
echo "   php artisan p:environment:setup"
echo ""
echo "3. Run migrations:"
echo "   php artisan migrate --force"
echo ""
echo "4. Create admin user:"
echo "   php artisan make:filament-user"
echo ""
echo "=========================================="
