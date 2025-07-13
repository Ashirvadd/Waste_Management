const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/yolo';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.round(Math.random() * 1E9));
    cb(null, 'yolo-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// YOLO waste detection endpoint
router.post('/detect-waste', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imagePath = req.file.path;
    const modelPath = path.join(__dirname, '../ml_models/Waste-Classification-using-YOLOv8-main/Waste-Classification-using-YOLOv8-main/streamlit-detection-tracking - app/weights/best.pt');
    
    // Check if model exists
    if (!fs.existsSync(modelPath)) {
      return res.status(500).json({ error: 'YOLO model not found' });
    }

    // Run Python script for waste detection
    const pythonScript = path.join(__dirname, '../ml_models/waste_classifier.py');
    
    const pythonProcess = spawn('python', [
      pythonScript,
      '--image', imagePath,
      '--model', modelPath,
      '--confidence', '0.2'
    ]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      console.log('Python process exited with code:', code);
      console.log('Python stdout:', result);
      console.log('Python stderr:', error);
      
      if (code !== 0) {
        console.error('Python script error:', error);
        return res.status(500).json({ 
          error: 'Failed to process image',
          details: error
        });
      }

      try {
        // Clean up uploaded file first
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
        
        const detectionResult = JSON.parse(result);
        
        // Check if the Python script returned an error
        if (!detectionResult.success) {
          return res.status(500).json({ 
            error: detectionResult.error || 'Detection failed',
            details: detectionResult
          });
        }
        
        res.json({
          success: true,
          result: detectionResult,
          imageName: req.file.originalname
        });
      } catch (parseError) {
        console.error('Error parsing Python output:', parseError);
        console.error('Raw Python output:', result);
        res.status(500).json({ 
          error: 'Failed to parse detection results',
          details: result
        });
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python process:', err);
      res.status(500).json({ error: 'Failed to start detection process' });
    });

  } catch (error) {
    console.error('Error in waste detection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available model information
router.get('/models', (req, res) => {
  try {
    const modelsDir = path.join(__dirname, '../ml_models/Waste-Classification-using-YOLOv8-main/Waste-Classification-using-YOLOv8-main/streamlit-detection-tracking - app/weights');
    
    if (!fs.existsSync(modelsDir)) {
      return res.json({ models: [] });
    }

    const models = fs.readdirSync(modelsDir)
      .filter(file => file.endsWith('.pt') || file.endsWith('.pkl'))
      .map(file => ({
        name: file,
        path: path.join(modelsDir, file),
        size: fs.statSync(path.join(modelsDir, file)).size
      }));

    res.json({ models });
  } catch (error) {
    console.error('Error getting models:', error);
    res.status(500).json({ error: 'Failed to get model information' });
  }
});

// Health check for AI services
router.get('/health', (req, res) => {
  try {
    const pythonScript = path.join(__dirname, '../ml_models/health_check.py');
    
    const pythonProcess = spawn('python', [pythonScript]);
    
    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const healthResult = JSON.parse(result);
          res.json({
            status: 'healthy',
            services: healthResult
          });
        } catch (parseError) {
          res.json({
            status: 'healthy',
            message: 'AI services are running'
          });
        }
      } else {
        res.status(503).json({
          status: 'unhealthy',
          error: error || 'AI services check failed'
        });
      }
    });

    pythonProcess.on('error', (err) => {
      res.status(503).json({
        status: 'unhealthy',
        error: 'Failed to check AI services'
      });
    });

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'AI services unavailable'
    });
  }
});

module.exports = router; 