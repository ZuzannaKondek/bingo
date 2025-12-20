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

