#!/usr/bin/env python3
"""
Streamlit app for YOLO waste detection
"""

import streamlit as st
import cv2
import numpy as np
from PIL import Image
import os
from pathlib import Path
from ultralytics import YOLO

# Page config
st.set_page_config(
    page_title="Waste Classification using YOLOv8",
    page_icon="♻️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Title
st.title("♻️ Waste Classification using YOLOv8")
st.markdown("---")

# Sidebar configuration
st.sidebar.header("⚙️ Model Configuration")

# Model path
model_path = "waste-detection-main/waste-detection-main/weights/best.pt"

# Confidence threshold
confidence = st.sidebar.slider(
    "Confidence Threshold", 
    min_value=0.1, 
    max_value=1.0, 
    value=0.3, 
    step=0.1,
    help="Minimum confidence score for detections"
)

# Load model
@st.cache_resource
def load_model():
    try:
        model = YOLO(model_path)
        st.sidebar.success("✅ Model loaded successfully!")
        return model
    except Exception as e:
        st.sidebar.error(f"❌ Error loading model: {e}")
        return None

model = load_model()

# Main content
if model is None:
    st.error("❌ Failed to load model. Please check the model path.")
    st.stop()

# Source selection
st.sidebar.header("📷 Input Source")
source = st.sidebar.radio(
    "Choose input source:",
    ["📁 Upload Image", "📹 Webcam"]
)

if source == "📁 Upload Image":
    st.header("📁 Image Upload")
    
    uploaded_file = st.file_uploader(
        "Choose an image file",
        type=['jpg', 'jpeg', 'png', 'bmp', 'webp'],
        help="Upload an image to classify waste"
    )
    
    if uploaded_file is not None:
        # Display original image
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("📸 Original Image")
            image = Image.open(uploaded_file)
            st.image(image, caption="Uploaded Image", use_column_width=True)
        
        # Detect button
        if st.button("🔍 Detect Waste", type="primary"):
            with st.spinner("🔍 Detecting waste..."):
                try:
                    # Convert PIL image to numpy array
                    img_array = np.array(image)
                    
                    # Run detection
                    results = model(img_array, conf=confidence)
                    
                    # Process results
                    detections = []
                    for result in results:
                        boxes = result.boxes
                        if boxes is not None:
                            for box in boxes:
                                # Get coordinates
                                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                                
                                # Get confidence and class
                                conf = float(box.conf[0].cpu().numpy())
                                class_id = int(box.cls[0].cpu().numpy())
                                
                                # Get class name
                                class_name = model.names[class_id]
                                
                                detections.append({
                                    'class': class_name,
                                    'confidence': conf,
                                    'bbox': [int(x1), int(y1), int(x2), int(y2)]
                                })
                    
                    # Display results
                    with col2:
                        st.subheader("🎯 Detection Results")
                        
                        if detections:
                            # Plot results on image
                            result_img = results[0].plot()
                            st.image(result_img, caption="Detected Objects", use_column_width=True)
                            
                            # Display detection details
                            st.subheader("📊 Detection Details")
                            
                            # Summary
                            class_counts = {}
                            for det in detections:
                                class_name = det['class']
                                if class_name not in class_counts:
                                    class_counts[class_name] = 0
                                class_counts[class_name] += 1
                            
                            st.write(f"**Total detections:** {len(detections)}")
                            
                            # Display each detection
                            for i, det in enumerate(detections):
                                with st.expander(f"Detection {i+1}: {det['class']} ({(det['confidence']*100):.1f}%)"):
                                    st.write(f"**Class:** {det['class']}")
                                    st.write(f"**Confidence:** {(det['confidence']*100):.1f}%")
                                    st.write(f"**Bounding Box:** {det['bbox']}")
                        else:
                            st.warning("⚠️ No objects detected with the current confidence threshold.")
                            st.info("💡 Try lowering the confidence threshold in the sidebar.")
                            
                except Exception as e:
                    st.error(f"❌ Error during detection: {e}")

elif source == "📹 Webcam":
    st.header("📹 Webcam Detection")
    
    # Webcam input
    webcam_image = st.camera_input("Take a picture")
    
    if webcam_image is not None:
        # Display captured image
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("📸 Captured Image")
            st.image(webcam_image, caption="Captured Image", use_column_width=True)
        
        # Detect button
        if st.button("🔍 Detect Waste", type="primary"):
            with st.spinner("🔍 Detecting waste..."):
                try:
                    # Convert to numpy array
                    img_array = np.array(webcam_image)
                    
                    # Run detection
                    results = model(img_array, conf=confidence)
                    
                    # Process results
                    detections = []
                    for result in results:
                        boxes = result.boxes
                        if boxes is not None:
                            for box in boxes:
                                # Get coordinates
                                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                                
                                # Get confidence and class
                                conf = float(box.conf[0].cpu().numpy())
                                class_id = int(box.cls[0].cpu().numpy())
                                
                                # Get class name
                                class_name = model.names[class_id]
                                
                                detections.append({
                                    'class': class_name,
                                    'confidence': conf,
                                    'bbox': [int(x1), int(y1), int(x2), int(y2)]
                                })
                    
                    # Display results
                    with col2:
                        st.subheader("🎯 Detection Results")
                        
                        if detections:
                            # Plot results on image
                            result_img = results[0].plot()
                            st.image(result_img, caption="Detected Objects", use_column_width=True)
                            
                            # Display detection details
                            st.subheader("📊 Detection Details")
                            
                            # Summary
                            class_counts = {}
                            for det in detections:
                                class_name = det['class']
                                if class_name not in class_counts:
                                    class_counts[class_name] = 0
                                class_counts[class_name] += 1
                            
                            st.write(f"**Total detections:** {len(detections)}")
                            
                            # Display each detection
                            for i, det in enumerate(detections):
                                with st.expander(f"Detection {i+1}: {det['class']} ({(det['confidence']*100):.1f}%)"):
                                    st.write(f"**Class:** {det['class']}")
                                    st.write(f"**Confidence:** {(det['confidence']*100):.1f}%")
                                    st.write(f"**Bounding Box:** {det['bbox']}")
                        else:
                            st.warning("⚠️ No objects detected with the current confidence threshold.")
                            st.info("💡 Try lowering the confidence threshold in the sidebar.")
                            
                except Exception as e:
                    st.error(f"❌ Error during detection: {e}")

# Footer
st.markdown("---")
st.markdown("**Waste Classification using YOLOv8** | Built with Streamlit") 