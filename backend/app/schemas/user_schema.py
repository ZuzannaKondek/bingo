"""User schemas for serialization and validation."""
from marshmallow import Schema, fields, validate, validates, ValidationError
from app.extensions import ma
from app.models.user import User


class UserSchema(ma.SQLAlchemySchema):
    """User schema for serialization."""
    
    class Meta:
        model = User
        load_instance = True
    
    id = ma.auto_field(dump_only=True)
    username = ma.auto_field(required=True, validate=validate.Length(min=3, max=80))
    email = ma.auto_field(required=True, validate=validate.Email())
    password = fields.String(load_only=True, required=True, validate=validate.Length(min=6))
    created_at = ma.auto_field(dump_only=True)
    is_active = ma.auto_field(dump_only=True)


class LoginSchema(Schema):
    """Login schema for validation."""
    
    username = fields.String(required=True)
    password = fields.String(required=True, load_only=True)


class RegisterSchema(Schema):
    """Registration schema for validation."""
    
    username = fields.String(required=True, validate=validate.Length(min=3, max=80))
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=6), load_only=True)
    
    @validates('username')
    def validate_username(self, value: str) -> None:
        """Validate username uniqueness.
        
        Args:
            value: Username to validate
            
        Raises:
            ValidationError: If username already exists
        """
        if User.query.filter_by(username=value).first():
            raise ValidationError('Username already exists')
    
    @validates('email')
    def validate_email(self, value: str) -> None:
        """Validate email uniqueness.
        
        Args:
            value: Email to validate
            
        Raises:
            ValidationError: If email already exists
        """
        if User.query.filter_by(email=value).first():
            raise ValidationError('Email already exists')

