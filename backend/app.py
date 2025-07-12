from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['DATABASE_URL'] = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost:5432/waste_management')

@app.route('/')
def home():
    return jsonify({
        'message': 'Waste Management API',
        'status': 'running',
        'version': '1.0.0'
    })

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': '2024-01-01T00:00:00Z'
    })

# Import routes
from routes import auth, ai_services, waste_management

# Register blueprints
app.register_blueprint(auth.bp)
app.register_blueprint(ai_services.bp)
app.register_blueprint(waste_management.bp)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 