from flask import Flask, request, jsonify, render_template, session, redirect, url_for # type: ignore
from flask_cors import CORS # type: ignore
import json
import os
from datetime import datetime
import uuid
import hashlib
import secrets

app = Flask(__name__)
# Configure CORS to allow credentials and specific origins
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5000", "https://*.vercel.app", "https://*.render.com"],
        "supports_credentials": True,
        "allow_headers": ["Content-Type", "Authorization"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
})

# Use SECRET_KEY from environment when available (recommended for production on Render).
# Fall back to a generated key for local development/testing, but don't rely on this in prod.
secret_key = os.environ.get('SECRET_KEY')
if not secret_key:
    # Generate a temporary secret for development if none provided.
    # Warning will be logged so deploys without a set SECRET_KEY are visible.
    secret_key = secrets.token_hex(32)
    app.logger.warning('SECRET_KEY not set; using a generated temporary secret key. Set SECRET_KEY in Render environment for stable sessions.')
app.secret_key = secret_key

# Error handlers to return JSON instead of HTML
@app.errorhandler(400)
def bad_request(e):
    return jsonify(error=str(e)), 400

@app.errorhandler(401)
def unauthorized(e):
    return jsonify(error=str(e)), 401

@app.errorhandler(404)
def not_found(e):
    return jsonify(error=str(e)), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify(error=str(e)), 405

@app.errorhandler(500)
def internal_server_error(e):
    return jsonify(error="Internal server error"), 500

# Health check endpoint
@app.route('/health')
def health_check():
    return jsonify(status="healthy", timestamp=datetime.now().isoformat())

# Data storage files
LOGIN_FILE = 'login.json'
CAMPAIGNS_DIR = 'campaigns'

def get_user_campaigns_file(user_id):
    """Get the campaigns file path for a specific user"""
    if not os.path.exists(CAMPAIGNS_DIR):
        os.makedirs(CAMPAIGNS_DIR)
    return os.path.join(CAMPAIGNS_DIR, f'{user_id}.json')

def load_campaigns(user_id):
    """Load campaigns from user-specific JSON file"""
    campaigns_file = get_user_campaigns_file(user_id)
    if os.path.exists(campaigns_file):
        with open(campaigns_file, 'r') as f:
            return json.load(f)
    return []

def save_campaigns(user_id, campaigns):
    """Save campaigns to user-specific JSON file"""
    campaigns_file = get_user_campaigns_file(user_id)
    with open(campaigns_file, 'w') as f:
        json.dump(campaigns, f, indent=2)

def get_campaign_by_id(campaigns, campaign_id):
    """Find campaign by ID"""
    for campaign in campaigns:
        if campaign['id'] == campaign_id:
            return campaign
    return None

# Authentication functions
def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def load_users():
    """Load users from JSON file"""
    if os.path.exists(LOGIN_FILE):
        with open(LOGIN_FILE, 'r') as f:
            return json.load(f)
    return []

def save_users(users):
    """Save users to JSON file"""
    with open(LOGIN_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def get_user_by_email(users, email):
    """Find user by email"""
    for user in users:
        if user['email'] == email:
            return user
    return None

def is_logged_in():
    """Check if user is logged in"""
    return 'user_id' in session

def require_auth(f):
    """Decorator to require authentication"""
    def decorated_function(*args, **kwargs):
        if not is_logged_in():
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

# Authentication routes
@app.route('/')
def login_page():
    """Serve the login page"""
    if is_logged_in():
        return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/register')
def register_page():
    """Serve the register page"""
    if is_logged_in():
        return redirect(url_for('dashboard'))
    return render_template('register.html')

@app.route('/forgot-password')
def forgot_password_page():
    """Serve the forgot password page"""
    if is_logged_in():
        return redirect(url_for('dashboard'))
    return render_template('forgot-password.html')

@app.route('/reset-password')
def reset_password_page():
    """Serve the reset password page"""
    if is_logged_in():
        return redirect(url_for('dashboard'))
    return render_template('reset-password.html')

@app.route('/dashboard')
def dashboard():
    """Serve the main dashboard"""
    if not is_logged_in():
        return redirect(url_for('login_page'))
    return render_template('index.html')

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['email', 'password', 'name']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Validate email format
    if '@' not in data['email']:
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate password length
    if len(data['password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400
    
    users = load_users()
    
    # Check if user already exists
    if get_user_by_email(users, data['email']):
        return jsonify({'error': 'User already exists'}), 400
    
    # Create new user
    new_user = {
        'id': str(uuid.uuid4()),
        'email': data['email'],
        'password': hash_password(data['password']),
        'name': data['name'],
        'created_at': datetime.now().isoformat()
    }
    
    users.append(new_user)
    save_users(users)
    
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    data = request.get_json()
    
    # Validate required fields
    if 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Email and password are required'}), 400
    
    users = load_users()
    user = get_user_by_email(users, data['email'])
    
    if not user or user['password'] != hash_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Set session
    session['user_id'] = user['id']
    session['user_email'] = user['email']
    session['user_name'] = user['name']
    
    return jsonify({
        'message': 'Login successful',
        'user': {
            'id': user['id'],
            'email': user['email'],
            'name': user['name']
        }
    })

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout user"""
    session.clear()
    return jsonify({'message': 'Logout successful'})

@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    """Initiate password reset"""
    data = request.get_json()
    
    if 'email' not in data:
        return jsonify({'error': 'Email is required'}), 400
    
    users = load_users()
    user = get_user_by_email(users, data['email'])
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Generate reset token (in a real app, you'd send this via email)
    reset_token = secrets.token_hex(32)
    user['reset_token'] = reset_token
    user['reset_token_expires'] = (datetime.now().timestamp() + 3600)  # 1 hour
    
    save_users(users)
    
    # In a real application, you would send this token via email
    return jsonify({
        'message': 'Password reset token generated',
        'reset_token': reset_token  # Only for demo purposes
    })

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    """Reset password using token"""
    data = request.get_json()
    
    required_fields = ['token', 'new_password']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    if len(data['new_password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400
    
    users = load_users()
    
    # Find user by reset token
    user = None
    for u in users:
        if u.get('reset_token') == data['token']:
            user = u
            break
    
    if not user:
        return jsonify({'error': 'Invalid reset token'}), 400
    
    # Check if token is expired
    if datetime.now().timestamp() > user.get('reset_token_expires', 0):
        return jsonify({'error': 'Reset token has expired'}), 400
    
    # Update password
    user['password'] = hash_password(data['new_password'])
    user.pop('reset_token', None)
    user.pop('reset_token_expires', None)
    
    save_users(users)
    
    return jsonify({'message': 'Password reset successfully'})

@app.route('/api/auth/change-password', methods=['POST'])
@require_auth
def change_password():
    """Change password for logged-in user"""
    data = request.get_json()
    
    required_fields = ['current_password', 'new_password']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    if len(data['new_password']) < 6:
        return jsonify({'error': 'New password must be at least 6 characters long'}), 400
    
    users = load_users()
    user = get_user_by_email(users, session['user_email'])
    
    if not user or user['password'] != hash_password(data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 400
    
    # Update password
    user['password'] = hash_password(data['new_password'])
    save_users(users)
    
    return jsonify({'message': 'Password changed successfully'})

@app.route('/api/auth/me', methods=['GET'])
@require_auth
def get_current_user():
    """Get current user info"""
    return jsonify({
        'id': session['user_id'],
        'email': session['user_email'],
        'name': session['user_name']
    })

@app.route('/api/campaigns', methods=['GET'])
@require_auth
def get_campaigns():
    """Get all campaigns for the current user"""
    user_id = session['user_id']
    campaigns = load_campaigns(user_id)
    return jsonify(campaigns)

@app.route('/api/campaigns', methods=['POST'])
@require_auth
def add_campaign():
    """Add a new campaign for the current user"""
    data = request.get_json()
    user_id = session['user_id']
    
    # Validate required fields
    required_fields = ['name', 'client', 'start_date', 'status']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Validate status
    valid_statuses = ['Active', 'Paused', 'Completed']
    if data['status'] not in valid_statuses:
        return jsonify({'error': 'Invalid status. Must be Active, Paused, or Completed'}), 400
    
    campaigns = load_campaigns(user_id)
    
    # Create new campaign
    new_campaign = {
        'id': str(uuid.uuid4()),
        'name': data['name'],
        'client': data['client'],
        'start_date': data['start_date'],
        'status': data['status'],
        'created_at': datetime.now().isoformat(),
        'user_id': user_id  # Associate campaign with user
    }
    
    campaigns.append(new_campaign)
    save_campaigns(user_id, campaigns)
    
    return jsonify(new_campaign), 201

@app.route('/api/campaigns/<campaign_id>', methods=['PUT'])
@require_auth
def update_campaign(campaign_id):
    """Update campaign status for the current user"""
    data = request.get_json()
    user_id = session['user_id']
    
    if 'status' not in data:
        return jsonify({'error': 'Missing status field'}), 400
    
    valid_statuses = ['Active', 'Paused', 'Completed']
    if data['status'] not in valid_statuses:
        return jsonify({'error': 'Invalid status. Must be Active, Paused, or Completed'}), 400
    
    campaigns = load_campaigns(user_id)
    campaign = get_campaign_by_id(campaigns, campaign_id)
    
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    # Verify campaign belongs to current user
    if campaign.get('user_id') != user_id:
        return jsonify({'error': 'Campaign not found'}), 404
    
    campaign['status'] = data['status']
    save_campaigns(user_id, campaigns)
    
    return jsonify(campaign)

@app.route('/api/campaigns/<campaign_id>', methods=['DELETE'])
@require_auth
def delete_campaign(campaign_id):
    """Delete a campaign for the current user"""
    user_id = session['user_id']
    campaigns = load_campaigns(user_id)
    campaign = get_campaign_by_id(campaigns, campaign_id)
    
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    # Verify campaign belongs to current user
    if campaign.get('user_id') != user_id:
        return jsonify({'error': 'Campaign not found'}), 404
    
    campaigns.remove(campaign)
    save_campaigns(user_id, campaigns)
    
    return jsonify({'message': 'Campaign deleted successfully'})

@app.route('/api/dashboard', methods=['GET'])
@require_auth
def get_dashboard():
    """Get dashboard summary for the current user"""
    user_id = session['user_id']
    campaigns = load_campaigns(user_id)
    
    total_campaigns = len(campaigns)
    active_campaigns = len([c for c in campaigns if c['status'] == 'Active'])
    paused_campaigns = len([c for c in campaigns if c['status'] == 'Paused'])
    completed_campaigns = len([c for c in campaigns if c['status'] == 'Completed'])
    
    return jsonify({
        'total_campaigns': total_campaigns,
        'active_campaigns': active_campaigns,
        'paused_campaigns': paused_campaigns,
        'completed_campaigns': completed_campaigns
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
