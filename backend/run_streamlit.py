#!/usr/bin/env python3
"""
Script to run the Streamlit YOLO waste detection app
"""

import subprocess
import sys
import os
from pathlib import Path

def run_streamlit():
    """Run the Streamlit app"""
    try:
        # Change to ml_models directory
        ml_models_dir = Path(__file__).parent / "ml_models"
        os.chdir(ml_models_dir)
        
        print("🚀 Starting Streamlit YOLO Waste Detection App...")
        print(f"📁 Working directory: {os.getcwd()}")
        print("🌐 The app will open in your browser at: http://localhost:8501")
        print("📱 You can also access it on your mobile device using your computer's IP address")
        print("⏹️  Press Ctrl+C to stop the server")
        print("-" * 60)
        
        # Run streamlit
        subprocess.run([
            sys.executable, "-m", "streamlit", "run", "waste-detection-main/waste-detection-main/app.py",
            "--server.port", "8501",
            "--server.address", "0.0.0.0",
            "--browser.gatherUsageStats", "false"
        ])
        
    except KeyboardInterrupt:
        print("\n🛑 Streamlit server stopped by user")
    except Exception as e:
        print(f"❌ Error running Streamlit: {e}")
        print("💡 Make sure you have installed the requirements:")
        print("   pip install -r ml_models/requirements.txt")

if __name__ == "__main__":
    run_streamlit() 