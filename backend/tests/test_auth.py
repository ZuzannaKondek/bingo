"""Tests for authentication endpoints."""
import pytest


def test_register_success(client):
    """Test successful user registration."""
    response = client.post('/api/auth/register', json={
        'username': 'newuser',
        'email': 'new@example.com',
        'password': 'password123'
    })
    
    assert response.status_code == 201
    data = response.get_json()
    assert 'user' in data
    assert 'access_token' in data
    assert data['user']['username'] == 'newuser'


def test_register_duplicate_username(client):
    """Test registration with duplicate username."""
    # Create first user
    client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test1@example.com',
        'password': 'password123'
    })
    
    # Try to create user with same username
    response = client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test2@example.com',
        'password': 'password123'
    })
    
    assert response.status_code == 400


def test_login_success(client):
    """Test successful login."""
    # Register user
    client.post('/api/auth/register', json={
        'username': 'loginuser',
        'email': 'login@example.com',
        'password': 'password123'
    })
    
    # Login
    response = client.post('/api/auth/login', json={
        'username': 'loginuser',
        'password': 'password123'
    })
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'user' in data
    assert 'access_token' in data


def test_login_invalid_credentials(client):
    """Test login with invalid credentials."""
    response = client.post('/api/auth/login', json={
        'username': 'nonexistent',
        'password': 'wrongpass'
    })
    
    assert response.status_code == 401


def test_get_current_user(client, auth_headers):
    """Test getting current authenticated user."""
    response = client.get('/api/auth/me', headers=auth_headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'user' in data
    assert data['user']['username'] == 'testuser'


def test_logout(client, auth_headers):
    """Test user logout."""
    response = client.post('/api/auth/logout', headers=auth_headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'message' in data

