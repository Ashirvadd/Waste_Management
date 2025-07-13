#!/usr/bin/env python3
"""
Waste Analysis using Groq API
This script provides advanced analysis of waste images using Groq's AI models.
"""

import argparse
import json
import sys
import os
import base64
from pathlib import Path
import requests
from PIL import Image
import io

def encode_image_to_base64(image_path):
    """Encode image to base64 string for API transmission."""
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except Exception as e:
        print(f"Error encoding image: {e}", file=sys.stderr)
        return None

def analyze_waste_with_groq(image_path, api_key):
    """Analyze waste image using Groq API."""
    try:
        # Encode image
        base64_image = encode_image_to_base64(image_path)
        if not base64_image:
            return {
                'success': False,
                'error': 'Failed to encode image'
            }
        
        # Prepare API request
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llava-3.1-sonar-small-128k",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """Analyze this waste image and provide detailed insights. Please include:
1. Types of waste visible in the image
2. Estimated quantities and volumes
3. Environmental impact assessment
4. Recommended disposal methods
5. Recycling potential
6. Safety considerations
7. Priority level for collection (low/medium/high/urgent)
8. Specific recommendations for waste management

Please provide a structured JSON response with these categories."""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 2048,
            "temperature": 0.1
        }
        
        # Make API request
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code != 200:
            return {
                'success': False,
                'error': f'API request failed: {response.status_code} - {response.text}'
            }
        
        # Parse response
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        # Try to extract JSON from response
        try:
            # Look for JSON in the response
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                json_str = content[start_idx:end_idx]
                analysis_data = json.loads(json_str)
            else:
                # If no JSON found, create structured response
                analysis_data = {
                    'raw_analysis': content,
                    'waste_types': 'Extracted from analysis',
                    'quantities': 'Estimated from image',
                    'environmental_impact': 'Assessed from analysis',
                    'disposal_methods': 'Recommended based on content',
                    'recycling_potential': 'Evaluated from waste types',
                    'safety_considerations': 'Identified from analysis',
                    'priority_level': 'medium',
                    'recommendations': 'Based on waste composition'
                }
        except json.JSONDecodeError:
            # Fallback to structured text analysis
            analysis_data = {
                'raw_analysis': content,
                'waste_types': 'Extracted from analysis',
                'quantities': 'Estimated from image',
                'environmental_impact': 'Assessed from analysis',
                'disposal_methods': 'Recommended based on content',
                'recycling_potential': 'Evaluated from waste types',
                'safety_considerations': 'Identified from analysis',
                'priority_level': 'medium',
                'recommendations': 'Based on waste composition'
            }
        
        return {
            'success': True,
            'analysis': analysis_data,
            'api_response_time': response.elapsed.total_seconds(),
            'model_used': 'llava-3.1-sonar-small-128k'
        }
        
    except requests.exceptions.Timeout:
        return {
            'success': False,
            'error': 'API request timed out'
        }
    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'error': f'API request failed: {str(e)}'
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Analysis failed: {str(e)}'
        }

def get_image_metadata(image_path):
    """Get basic image metadata."""
    try:
        with Image.open(image_path) as img:
            return {
                'format': img.format,
                'mode': img.mode,
                'size': img.size,
                'width': img.width,
                'height': img.height
            }
    except Exception as e:
        return {
            'error': f'Failed to get image metadata: {str(e)}'
        }

def main():
    parser = argparse.ArgumentParser(description='Waste Analysis using Groq API')
    parser.add_argument('--image', required=True, help='Path to input image')
    parser.add_argument('--api-key', required=True, help='Groq API key')
    parser.add_argument('--output', help='Output file path (optional)')
    
    args = parser.parse_args()
    
    # Check if image exists
    if not os.path.exists(args.image):
        print(json.dumps({
            'success': False,
            'error': f'Image file not found: {args.image}'
        }))
        sys.exit(1)
    
    # Get image metadata
    metadata = get_image_metadata(args.image)
    
    # Analyze waste
    result = analyze_waste_with_groq(args.image, args.api_key)
    
    # Add metadata to result
    if result['success']:
        result['image_metadata'] = metadata
        result['image_path'] = args.image
    
    # Output result
    output_json = json.dumps(result, indent=2)
    
    if args.output:
        try:
            with open(args.output, 'w') as f:
                f.write(output_json)
            print(f"Analysis saved to: {args.output}")
        except Exception as e:
            print(f"Error saving output: {e}", file=sys.stderr)
            print(output_json)
    else:
        print(output_json)

if __name__ == '__main__':
    main() 