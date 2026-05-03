"""
MongoDB utility functions for direct MongoDB access.
This allows using MongoDB alongside Django's default database.
"""

from pymongo import MongoClient
from django.conf import settings


def get_mongo_client():
    """
    Returns a MongoDB client instance.
    """
    return MongoClient(settings.MONGODB_URI)


def get_mongo_db():
    """
    Returns the MongoDB database instance.
    """
    client = get_mongo_client()
    return client[settings.MONGODB_DB_NAME]


def get_tickets_collection():
    """
    Returns the tickets collection from MongoDB.
    """
    db = get_mongo_db()
    return db['tickets']


def get_users_collection():
    """
    Returns the users collection from MongoDB.
    """
    db = get_mongo_db()
    return db['users']


def create_user(username, password):
    """
    Creates a new user with hashed password.
    Returns True if successful, False if username already exists.
    """
    import bcrypt
    from datetime import datetime
    
    users = get_users_collection()
    
    # Check if username already exists
    if users.find_one({'username': username}):
        return False
    
    # Hash the password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    # Create user document
    user_data = {
        'username': username,
        'password_hash': password_hash,
        'created_at': datetime.utcnow()
    }
    
    users.insert_one(user_data)
    return True


def authenticate_user(username, password):
    """
    Validates user credentials.
    Returns user data (without password) if successful, None if failed.
    """
    import bcrypt
    
    users = get_users_collection()
    user = users.find_one({'username': username})
    
    if not user:
        return None
    
    # Verify password
    if bcrypt.checkpw(password.encode('utf-8'), user['password_hash']):
        # Remove password hash from returned data
        user.pop('password_hash', None)
        return user
    
    return None


def get_user_by_username(username):
    """
    Retrieves user information by username (without password hash).
    """
    users = get_users_collection()
    user = users.find_one({'username': username})
    
    if user:
        user.pop('password_hash', None)
        return user
    
    return None


def get_ticket_stats():
    """
    Returns ticket statistics (total, used, available).
    """
    tickets = get_tickets_collection()
    
    total_tickets = tickets.count_documents({})
    used_tickets = tickets.count_documents({'is_used': True})
    available_tickets = total_tickets - used_tickets
    
    return {
        'total': total_tickets,
        'used': used_tickets,
        'available': available_tickets
    }


# Example usage:
# from tickets.mongodb_utils import get_tickets_collection
# 
# # Insert a ticket
# tickets = get_tickets_collection()
# ticket_data = {
#     'ticket_id': 'ABC123',
#     'is_used': False,
#     'scanned_at': None
# }
# tickets.insert_one(ticket_data)
#
# # Query tickets
# all_tickets = tickets.find()
# unused_tickets = tickets.find({'is_used': False})
