"""Flask application entry point."""
import os
import sys
from pathlib import Path

# Add custom site-packages directory to Python path if it exists
# This handles cases where packages are installed in non-standard locations
backend_dir = Path(__file__).parent

# Try multiple possible locations for custom site-packages
possible_paths = [
    backend_dir / 'app' / 'lib' / f'python{sys.version_info.major}.{sys.version_info.minor}' / 'site-packages',
    backend_dir / 'app' / 'lib' / 'python3.11' / 'site-packages',
    backend_dir / 'app' / 'lib' / 'site-packages',
    backend_dir / 'lib' / f'python{sys.version_info.major}.{sys.version_info.minor}' / 'site-packages',
]

for custom_site_packages in possible_paths:
    if custom_site_packages.exists() and str(custom_site_packages) not in sys.path:
        sys.path.insert(0, str(custom_site_packages))
        break

from app import create_app
from app.extensions import socketio

app = create_app()

if __name__ == '__main__':
    # Get port from environment variable or default to 12199
    port = int(os.getenv('PORT', 12199))
    # Get debug mode from environment (default to False for production)
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Check if static files exist
    static_folder = os.path.join(os.path.dirname(__file__), 'static')
    static_index = os.path.join(static_folder, 'index.html')
    
    # Get server hostname/IP for display
    import socket
    try:
        hostname = socket.gethostname()
        # Try to get the actual IP address
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        server_ip = s.getsockname()[0]
        s.close()
    except Exception:
        server_ip = "localhost"
        hostname = "localhost"
    
    print("=" * 60)
    print("Starting Bingo Application Server")
    print("=" * 60)
    print(f"Port: {port}")
    print(f"Debug mode: {debug}")
    print(f"Static folder: {static_folder}")
    
    if os.path.exists(static_index):
        print(f"✓ Static files found: {static_index}")
    else:
        print(f"⚠ WARNING: Static files not found at {static_index}")
        print("  Frontend needs to be built. Run: ./build.sh")
    
    print("\n" + "=" * 60)
    print("Application URLs:")
    print("=" * 60)
    print(f"  Local:    http://localhost:{port}")
    print(f"  Network:  http://{server_ip}:{port}")
    if hostname != server_ip:
        print(f"  Hostname: http://{hostname}:{port}")
    print(f"\n  API Health: http://{server_ip}:{port}/api/health")
    print("=" * 60)
    print(f"\nServer starting on http://0.0.0.0:{port}")
    print("Press CTRL+C to stop the server")
    print("=" * 60)
    
    socketio.run(app, host='0.0.0.0', port=port, debug=debug, log_output=True)

