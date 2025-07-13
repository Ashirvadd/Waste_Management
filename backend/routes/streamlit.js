const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const router = express.Router();

let streamlitProcess = null;

// Start Streamlit app
router.post('/start-streamlit', async (req, res) => {
  try {
    // Check if Streamlit is already running
    if (streamlitProcess) {
      return res.json({ success: true, message: 'Streamlit is already running' });
    }

    // Path to the Streamlit app
    const streamlitAppPath = path.join(__dirname, '../ml_models/waste-detection-main/waste-detection-main/app.py');
    
    console.log('Starting Streamlit app...');
    console.log('App path:', streamlitAppPath);

    // Start Streamlit process
    streamlitProcess = spawn('streamlit', [
      'run',
      streamlitAppPath,
      '--server.port', '8501',
      '--server.address', '0.0.0.0',
      '--browser.gatherUsageStats', 'false'
    ], {
      cwd: path.join(__dirname, '../ml_models'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle process events
    streamlitProcess.stdout.on('data', (data) => {
      console.log('Streamlit stdout:', data.toString());
    });

    streamlitProcess.stderr.on('data', (data) => {
      console.log('Streamlit stderr:', data.toString());
    });

    streamlitProcess.on('close', (code) => {
      console.log('Streamlit process closed with code:', code);
      streamlitProcess = null;
    });

    streamlitProcess.on('error', (error) => {
      console.error('Streamlit process error:', error);
      streamlitProcess = null;
    });

    // Wait a bit for Streamlit to start
    setTimeout(() => {
      res.json({ 
        success: true, 
        message: 'Streamlit started successfully',
        url: 'http://localhost:8501'
      });
    }, 2000);

  } catch (error) {
    console.error('Error starting Streamlit:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start Streamlit',
      details: error.message 
    });
  }
});

// Stop Streamlit app
router.post('/stop-streamlit', async (req, res) => {
  try {
    if (streamlitProcess) {
      streamlitProcess.kill('SIGTERM');
      streamlitProcess = null;
      res.json({ success: true, message: 'Streamlit stopped successfully' });
    } else {
      res.json({ success: true, message: 'Streamlit was not running' });
    }
  } catch (error) {
    console.error('Error stopping Streamlit:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to stop Streamlit',
      details: error.message 
    });
  }
});

// Get Streamlit status
router.get('/streamlit-status', async (req, res) => {
  try {
    const isRunning = streamlitProcess !== null;
    res.json({ 
      success: true, 
      isRunning,
      url: isRunning ? 'http://localhost:8501' : null
    });
  } catch (error) {
    console.error('Error checking Streamlit status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check Streamlit status',
      details: error.message 
    });
  }
});

module.exports = router; 