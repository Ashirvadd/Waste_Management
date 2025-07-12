#!/usr/bin/env python3
"""
Health Check for ML Models
This script verifies that all ML models and dependencies are working correctly.
"""

import json
import sys
import os
from pathlib import Path

def check_ultralytics():
    """Check if Ultralytics/YOLOv8 is available."""
    try:
        from ultralytics import YOLO
        return {
            'status': 'available',
            'version': '8.0.196'
        }
    except ImportError as e:
        return {
            'status': 'unavailable',
            'error': str(e)
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }

def check_opencv():
    """Check if OpenCV is available."""
    try:
        import cv2
        return {
            'status': 'available',
            'version': cv2.__version__
        }
    except ImportError as e:
        return {
            'status': 'unavailable',
            'error': str(e)
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }

def check_pillow():
    """Check if Pillow is available."""
    try:
        from PIL import Image
        return {
            'status': 'available',
            'version': Image.__version__
        }
    except ImportError as e:
        return {
            'status': 'unavailable',
            'error': str(e)
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }

def check_requests():
    """Check if requests library is available."""
    try:
        import requests
        return {
            'status': 'available',
            'version': requests.__version__
        }
    except ImportError as e:
        return {
            'status': 'unavailable',
            'error': str(e)
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }

def check_groq_api():
    """Check if Groq API key is configured."""
    api_key = os.getenv('GROQ_API_KEY')
    if api_key:
        return {
            'status': 'configured',
            'key_length': len(api_key)
        }
    else:
        return {
            'status': 'not_configured',
            'error': 'GROQ_API_KEY environment variable not set'
        }

def check_model_files():
    """Check if YOLOv8 model files are available."""
    model_paths = [
        'yolov8n.pt',
        'yolov8s.pt',
        'yolov8m.pt',
        'yolov8l.pt',
        'yolov8x.pt'
    ]
    
    available_models = []
    missing_models = []
    
    for model_path in model_paths:
        if os.path.exists(model_path):
            available_models.append(model_path)
        else:
            missing_models.append(model_path)
    
    return {
        'available': available_models,
        'missing': missing_models,
        'total_available': len(available_models),
        'total_missing': len(missing_models)
    }

def check_directories():
    """Check if required directories exist."""
    required_dirs = [
        'uploads',
        'ai-inputs',
        'models'
    ]
    
    existing_dirs = []
    missing_dirs = []
    
    for dir_path in required_dirs:
        if os.path.exists(dir_path) and os.path.isdir(dir_path):
            existing_dirs.append(dir_path)
        else:
            missing_dirs.append(dir_path)
    
    return {
        'existing': existing_dirs,
        'missing': missing_dirs,
        'total_existing': len(existing_dirs),
        'total_missing': len(missing_dirs)
    }

def main():
    """Run comprehensive health check."""
    health_status = {
        'timestamp': '2024-01-01T00:00:00Z',
        'overall_status': 'unknown',
        'dependencies': {},
        'models': {},
        'directories': {},
        'api_keys': {}
    }
    
    # Check dependencies
    health_status['dependencies'] = {
        'ultralytics': check_ultralytics(),
        'opencv': check_opencv(),
        'pillow': check_pillow(),
        'requests': check_requests()
    }
    
    # Check models
    health_status['models'] = check_model_files()
    
    # Check directories
    health_status['directories'] = check_directories()
    
    # Check API keys
    health_status['api_keys'] = {
        'groq': check_groq_api()
    }
    
    # Determine overall status
    all_available = True
    critical_errors = []
    
    # Check critical dependencies
    critical_deps = ['ultralytics', 'opencv', 'pillow', 'requests']
    for dep in critical_deps:
        if health_status['dependencies'][dep]['status'] != 'available':
            all_available = False
            critical_errors.append(f"{dep}: {health_status['dependencies'][dep].get('error', 'Unknown error')}")
    
    # Check if at least one model is available
    if health_status['models']['total_available'] == 0:
        all_available = False
        critical_errors.append("No YOLOv8 models available")
    
    # Set overall status
    if all_available:
        health_status['overall_status'] = 'healthy'
    else:
        health_status['overall_status'] = 'unhealthy'
        health_status['critical_errors'] = critical_errors
    
    # Update timestamp
    from datetime import datetime
    health_status['timestamp'] = datetime.now().isoformat()
    
    # Output JSON result
    print(json.dumps(health_status, indent=2))
    
    # Exit with appropriate code
    if health_status['overall_status'] == 'healthy':
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == '__main__':
    main() 