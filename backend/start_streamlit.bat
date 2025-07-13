@echo off
echo Starting YOLO Waste Detection Streamlit App...
echo.
echo The app will open in your browser at: http://localhost:8501
echo Press Ctrl+C to stop the server
echo.
cd ml_models
python -m streamlit run streamlit_app.py --server.port 8501 --server.address 0.0.0.0
pause 