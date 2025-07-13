Write-Host "Starting YOLO Waste Detection Streamlit App..." -ForegroundColor Green
Write-Host ""
Write-Host "The app will open in your browser at: http://localhost:8501" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

Set-Location "ml_models"
python -m streamlit run streamlit_app.py --server.port 8501 --server.address 0.0.0.0 