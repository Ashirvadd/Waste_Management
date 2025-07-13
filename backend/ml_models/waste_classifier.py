#!/usr/bin/env python3
"""
Waste Classification using YOLOv8
This script is called from the Node.js backend to classify waste in images.
"""

import argparse
import json
import sys
import os
from pathlib import Path
from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image

# Waste categories for classification - based on actual model training
WASTE_CATEGORIES = {
    0: 'biodegradable',
    1: 'cardboard', 
    2: 'glass',
    3: 'metal',
    4: 'paper',  # This might be missing from the model output
    5: 'plastic'
}

def load_model(model_path='yolov8n.pt'):
    """Load YOLOv8 model for waste classification."""
    try:
        print(f"Loading model from: {model_path}", file=sys.stderr)
        model = YOLO(model_path)
        print(f"Model loaded successfully", file=sys.stderr)
        return model
    except Exception as e:
        print(f"Error loading model: {e}", file=sys.stderr)
        return None

def classify_waste(image_path, model):
    """Classify waste in the given image."""
    try:
        print(f"Processing image: {image_path}", file=sys.stderr)
        
        # Load and preprocess image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image: {image_path}")
        
        print(f"Image loaded successfully, shape: {image.shape}", file=sys.stderr)
        
        # Run inference
        results = model(image)
        print(f"Inference completed, results: {len(results)}", file=sys.stderr)
        
        # Process results
        detections = []
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                print(f"Found {len(boxes)} detections", file=sys.stderr)
                for box in boxes:
                    # Get coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    
                    # Get confidence and class
                    confidence = float(box.conf[0].cpu().numpy())
                    class_id = int(box.cls[0].cpu().numpy())
                    
                    # Map class ID to waste category
                    waste_type = WASTE_CATEGORIES.get(class_id, 'unknown')
                    
                    detection = {
                        'type': waste_type,
                        'confidence': round(confidence, 3),
                        'bbox': {
                            'x1': int(x1),
                            'y1': int(y1),
                            'x2': int(x2),
                            'y2': int(y2)
                        },
                        'area': int((x2 - x1) * (y2 - y1))
                    }
                    detections.append(detection)
            else:
                print("No detections found", file=sys.stderr)
        
        # Sort by confidence
        detections.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Calculate summary statistics
        waste_summary = {}
        for detection in detections:
            waste_type = detection['type']
            if waste_type not in waste_summary:
                waste_summary[waste_type] = {
                    'count': 0,
                    'total_confidence': 0,
                    'total_area': 0
                }
            waste_summary[waste_type]['count'] += 1
            waste_summary[waste_type]['total_confidence'] += detection['confidence']
            waste_summary[waste_type]['total_area'] += detection['area']
        
        # Calculate averages
        for waste_type in waste_summary:
            count = waste_summary[waste_type]['count']
            waste_summary[waste_type]['avg_confidence'] = round(
                waste_summary[waste_type]['total_confidence'] / count, 3
            )
            waste_summary[waste_type]['avg_area'] = int(
                waste_summary[waste_type]['total_area'] / count
            )
        
        result = {
            'success': True,
            'detections': detections,
            'summary': waste_summary,
            'total_detections': len(detections)
        }
        
        print(f"Classification completed: {len(detections)} detections", file=sys.stderr)
        return result
        
    except Exception as e:
        print(f"Error in classify_waste: {e}", file=sys.stderr)
        return {
            'success': False,
            'error': str(e),
            'detections': [],
            'summary': {},
            'total_detections': 0
        }

def main():
    parser = argparse.ArgumentParser(description='Waste Classification using YOLOv8')
    parser.add_argument('--image', required=True, help='Path to input image')
    parser.add_argument('--model', default='yolov8n.pt', help='Path to YOLOv8 model')
    parser.add_argument('--confidence', type=float, default=0.2, help='Confidence threshold')
    
    args = parser.parse_args()
    
    try:
        # Check if image exists
        if not os.path.exists(args.image):
            print(json.dumps({
                'success': False,
                'error': f'Image file not found: {args.image}'
            }))
            sys.exit(1)
        
        # Check if model exists
        if not os.path.exists(args.model):
            print(json.dumps({
                'success': False,
                'error': f'Model file not found: {args.model}'
            }))
            sys.exit(1)
        
        # Load model
        model = load_model(args.model)
        if model is None:
            print(json.dumps({
                'success': False,
                'error': 'Failed to load YOLOv8 model'
            }))
            sys.exit(1)
        
        # Classify waste
        result = classify_waste(args.image, model)
        
        # Filter by confidence threshold
        if result['success']:
            result['detections'] = [
                d for d in result['detections'] 
                if d['confidence'] >= args.confidence
            ]
            result['total_detections'] = len(result['detections'])
        
        # Output JSON result
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }))
        sys.exit(1)

if __name__ == '__main__':
    main() 