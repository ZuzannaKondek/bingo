"""Authentication blueprint."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from marshmallow import ValidationError
from app.schemas.user_schema import RegisterSchema, LoginSchema, UserSchema
from app.services.auth_service import register_user, authenticate_user
from app.models.user import User
from app.extensions import db

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Token blocklist (in production, use Redis)
token_blocklist = set()


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user.
    
    Returns:
        JSON response with user data and tokens
    """
    try:
        # Validate input
        schema = RegisterSchema()
        data = schema.load(request.json)
        
        # Check for existing username/email (additional check)
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Register user
        user, tokens = register_user(
            username=data['username'],
            email=data['email'],
            password=data['password']
        )
        
        # Serialize user
        user_schema = UserSchema()
        user_data = user_schema.dump(user)
        
        return jsonify({
            'user': user_data,
            'access_token': tokens['access_token'],
            'refresh_token': tokens['refresh_token'],
        }), 201
        
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    except Exception as e:
        import traceback
        error_msg = str(e)
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': error_msg}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user.
    
    Returns:
        JSON response with user data and tokens
    """
    # #region agent log
    import json as json_module
    import os
    log_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.cursor', 'debug.log')
    try:
        with open(log_path, 'a') as f:
            f.write(json_module.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"B","location":"auth.py:61","message":"Login endpoint called","data":{"has_json":request.json is not None},"timestamp":int(__import__('time').time()*1000)}) + '\n')
    except: pass
    # #endregion
    try:
        # #region agent log
        try:
            with open(log_path, 'a') as f:
                f.write(json_module.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"B","location":"auth.py:68","message":"Before schema validation","data":{"request_json":str(request.json)[:100]},"timestamp":int(__import__('time').time()*1000)}) + '\n')
        except: pass
        # #endregion
        # Validate input
        schema = LoginSchema()
        data = schema.load(request.json)
        # #region agent log
        try:
            with open(log_path, 'a') as f:
                f.write(json_module.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"B","location":"auth.py:72","message":"After schema validation","data":{"username":data.get('username','')[:20]},"timestamp":int(__import__('time').time()*1000)}) + '\n')
        except: pass
        # #endregion
        
        # Authenticate user
        user, tokens = authenticate_user(
            username=data['username'],
            password=data['password']
        )
        # #region agent log
        try:
            with open(log_path, 'a') as f:
                f.write(json_module.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"B","location":"auth.py:78","message":"After authenticate_user","data":{"user_found":user is not None,"has_tokens":tokens is not None},"timestamp":int(__import__('time').time()*1000)}) + '\n')
        except: pass
        # #endregion
        
        if not user:
            # #region agent log
            try:
                with open(log_path, 'a') as f:
                    f.write(json_module.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"B","location":"auth.py:81","message":"User not found - returning 401","data":{},"timestamp":int(__import__('time').time()*1000)}) + '\n')
            except: pass
            # #endregion
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Serialize user
        user_schema = UserSchema()
        user_data = user_schema.dump(user)
        # #region agent log
        try:
            with open(log_path, 'a') as f:
                f.write(json_module.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"B","location":"auth.py:90","message":"Login successful","data":{"user_id":user_data.get('id')},"timestamp":int(__import__('time').time()*1000)}) + '\n')
        except: pass
        # #endregion
        
        return jsonify({
            'user': user_data,
            'access_token': tokens['access_token'],
            'refresh_token': tokens['refresh_token'],
        }), 200
        
    except ValidationError as err:
        # #region agent log
        try:
            with open(log_path, 'a') as f:
                f.write(json_module.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"B","location":"auth.py:95","message":"ValidationError","data":{"errors":str(err.messages)[:200]},"timestamp":int(__import__('time').time()*1000)}) + '\n')
        except: pass
        # #endregion
        return jsonify({'errors': err.messages}), 400
    except Exception as e:
        # #region agent log
        try:
            import traceback
            with open(log_path, 'a') as f:
                f.write(json_module.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"B","location":"auth.py:99","message":"Exception in login","data":{"error":str(e),"traceback":traceback.format_exc()[:500]},"timestamp":int(__import__('time').time()*1000)}) + '\n')
        except: pass
        # #endregion
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user by revoking token.
    
    Returns:
        JSON response confirming logout
    """
    try:
        jti = get_jwt()['jti']
        token_blocklist.add(jti)
        return jsonify({'message': 'Successfully logged out'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user.
    
    Returns:
        JSON response with current user data
    """
    try:
        identity = get_jwt_identity()
        print(f"Auth /me - Identity: {identity}, type: {type(identity)}")
        
        if not identity:
            return jsonify({'error': 'User ID not found in token'}), 401
        
        # Convert string identity to integer for database queries
        user_id = int(identity)
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_schema = UserSchema()
        user_data = user_schema.dump(user)
        
        return jsonify({'user': user_data}), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token.
    
    Returns:
        JSON response with new access token
    """
    try:
        from flask_jwt_extended import create_access_token
        
        identity = get_jwt_identity()
        access_token = create_access_token(identity=identity)
        
        return jsonify({'access_token': access_token}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# JWT token blocklist check
from app.extensions import jwt as jwt_manager

@jwt_manager.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    """Check if JWT token is revoked.
    
    Args:
        jwt_header: JWT header
        jwt_payload: JWT payload
        
    Returns:
        True if token is revoked, False otherwise
    """
    jti = jwt_payload['jti']
    return jti in token_blocklist

