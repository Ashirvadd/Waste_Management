from pathlib import Path
import streamlit as st
import helper
import settings
from PIL import Image
import numpy as np

st.set_page_config(
    page_title="Waste Detection",
)

st.sidebar.title("Detect Console")

model_path = Path(settings.DETECTION_MODEL)

st.title("Intelligent waste segregation system")
st.write("Choose your input method below to start waste detection.")

# Add tabs for different input methods
tab1, tab2 = st.tabs(["📹 Webcam Detection", "📁 Image Upload"])

with tab1:
    st.write("Start detecting objects in the webcam stream by clicking the button below. To stop the detection, click stop button in the top right corner of the webcam stream.")
st.markdown(
"""
<style>
    .stRecyclable {
        background-color: rgba(233,192,78,255);
        padding: 1rem 0.75rem;
        margin-bottom: 1rem;
        border-radius: 0.5rem;
        margin-top: 0 !important;
        font-size:18px !important;
    }
    .stNonRecyclable {
        background-color: rgba(94,128,173,255);
        padding: 1rem 0.75rem;
        margin-bottom: 1rem;
        border-radius: 0.5rem;
        margin-top: 0 !important;
        font-size:18px !important;
    }
    .stHazardous {
        background-color: rgba(194,84,85,255);
        padding: 1rem 0.75rem;
        margin-bottom: 1rem;
        border-radius: 0.5rem;
        margin-top: 0 !important;
        font-size:18px !important;
    }

</style>
""",
unsafe_allow_html=True
)

try:
    model = helper.load_model(model_path)
except Exception as ex:
    st.error(f"Unable to load model. Check the specified path: {model_path}")
    st.error(ex)

# Webcam Detection Tab
with tab1:
    helper.play_webcam(model)

# Image Upload Tab
with tab2:
    st.write("Upload an image to detect waste objects.")
    
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
                    results = model(img_array, conf=0.6)
                    
                    # Process results
                    detections = []
                    detected_items = set()
                    
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
                                detected_items.add(class_name)
                                
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
                            
                            # Classify waste types
                            recyclable_items, non_recyclable_items, hazardous_items = helper.classify_waste_type(detected_items)
                            
                            # Display classifications
                            if recyclable_items:
                                detected_items_str = "\n- ".join(helper.remove_dash_from_class_name(item) for item in recyclable_items)
                                st.markdown(
                                    f"<div class='stRecyclable'>♻️ Recyclable items:\n\n- {detected_items_str}</div>",
                                    unsafe_allow_html=True
                                )
                            if non_recyclable_items:
                                detected_items_str = "\n- ".join(helper.remove_dash_from_class_name(item) for item in non_recyclable_items)
                                st.markdown(
                                    f"<div class='stNonRecyclable'>🗑️ Non-Recyclable items:\n\n- {detected_items_str}</div>",
                                    unsafe_allow_html=True
                                )
                            if hazardous_items:
                                detected_items_str = "\n- ".join(helper.remove_dash_from_class_name(item) for item in hazardous_items)
                                st.markdown(
                                    f"<div class='stHazardous'>⚠️ Hazardous items:\n\n- {detected_items_str}</div>",
                                    unsafe_allow_html=True
                                )
                            
                            st.write(f"**Total detections:** {len(detections)}")
                            
                            # Display each detection
                            for i, det in enumerate(detections):
                                with st.expander(f"Detection {i+1}: {det['class']} ({(det['confidence']*100):.1f}%)"):
                                    st.write(f"**Class:** {det['class']}")
                                    st.write(f"**Confidence:** {(det['confidence']*100):.1f}%")
                                    st.write(f"**Bounding Box:** {det['bbox']}")
                        else:
                            st.warning("⚠️ No objects detected with the current confidence threshold.")
                            st.info("💡 Try uploading a different image or check if the image contains waste objects.")
                            
                except Exception as e:
                    st.error(f"❌ Error during detection: {e}")

st.sidebar.markdown("This is a demo of the waste detection model.", unsafe_allow_html=True)

