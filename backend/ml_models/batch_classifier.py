#!/usr/bin/env python3
"""
Batch Waste Classification using YOLOv8
This script processes multiple images for waste classification.
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

# Import shared constants
WASTE_CATEGORIES = {
    0: 'plastic',
    1: 'paper',
    2: 'glass',
    3: 'metal',
    4: 'organic',
    5: 'electronic',
    6: 'other'
}

def load_model(model_path='yolov8n.pt'):
    """Load YOLOv8 model for waste classification."""
    try:
        model = YOLO(model_path)
        return model
    except Exception as e:
        print(f"Error loading model: {e}", file=sys.stderr)
        return None

def classify_batch(image_paths, model, confidence_threshold=0.5):
    """Classify waste in multiple images."""
    try:
        batch_results = []
        
        for image_path in image_paths:
            if not os.path.exists(image_path):
                batch_results.append({
                    'image': image_path,
                    'success': False,
                    'error': f'Image file not found: {image_path}',
                    'detections': [],
                    'summary': {}
                })
                continue
            
            # Load and preprocess image
            image = cv2.imread(image_path)
            if image is None:
                batch_results.append({
                    'image': image_path,
                    'success': False,
                    'error': f'Could not load image: {image_path}',
                    'detections': [],
                    'summary': {}
                })
                continue
            
            # Run inference
            results = model(image)
            
            # Process results
            detections = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Get coordinates
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        
                        # Get confidence and class
                        confidence = float(box.conf[0].cpu().numpy())
                        class_id = int(box.cls[0].cpu().numpy())
                        
                        # Filter by confidence threshold
                        if confidence < confidence_threshold:
                            continue
                        
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
            
            batch_results.append({
                'image': image_path,
                'success': True,
                'detections': detections,
                'summary': waste_summary,
                'total_detections': len(detections)
            })
        
        return {
            'success': True,
            'batch_results': batch_results,
            'total_images': len(image_paths),
            'processed_images': len([r for r in batch_results if r['success']]),
            'failed_images': len([r for r in batch_results if not r['success']])
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'batch_results': [],
            'total_images': len(image_paths),
            'processed_images': 0,
            'failed_images': len(image_paths)
        }

def main():
    parser = argparse.ArgumentParser(description='Batch Waste Classification using YOLOv8')
    parser.add_argument('--images', required=True, help='JSON array of image paths')
    parser.add_argument('--model', default='yolov8n.pt', help='Path to YOLOv8 model')
    parser.add_argument('--confidence', type=float, default=0.5, help='Confidence threshold')
    
    args = parser.parse_args()
    
    try:
        # Parse image paths
        image_paths = json.loads(args.images)
        if not isinstance(image_paths, list):
            raise ValueError('Images argument must be a JSON array')
        
        if len(image_paths) == 0:
            print(json.dumps({
                'success': False,
                'error': 'No images provided'
            }))
            sys.exit(1)
        
        # Limit batch size
        max_batch_size = 10
        if len(image_paths) > max_batch_size:
            print(json.dumps({
                'success': False,
                'error': f'Batch size exceeds maximum limit of {max_batch_size}'
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
        
        # Classify batch
        result = classify_batch(image_paths, model, args.confidence)
        
        # Output JSON result
        print(json.dumps(result, indent=2))
        
    except json.JSONDecodeError:
        print(json.dumps({
            'success': False,
            'error': 'Invalid JSON format for images argument'
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'Batch processing failed: {str(e)}'
        }))
        sys.exit(1)

if __name__ == '__main__':
    main() 