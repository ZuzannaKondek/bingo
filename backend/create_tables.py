#!/usr/bin/env python3
"""Script to create all database tables from models.
Use this if migrations are not working properly.
"""
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Add custom site-packages if they exist
possible_paths = [
    backend_dir / 'app' / 'lib' / f'python{sys.version_info.major}.{sys.version_info.minor}' / 'site-packages',
    backend_dir / 'app' / 'lib' / 'python3.11' / 'site-packages',
    backend_dir / 'app' / 'lib' / 'site-packages',
    backend_dir / 'lib' / f'python{sys.version_info.major}.{sys.version_info.minor}' / 'site-packages',
]

for custom_site_packages in possible_paths:
    if custom_site_packages.exists() and str(custom_site_packages) not in sys.path:
        sys.path.insert(0, str(custom_site_packages))

from app import create_app
from app.extensions import db

app = create_app()

with app.app_context():
    print("Creating all database tables...")
    db.create_all()
    print("✓ Database tables created successfully!")
    print("\nTables created:")
    for table in db.metadata.tables:
        print(f"  - {table}")
