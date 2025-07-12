const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const router = express.Router();

// Multer configuration for AI model input
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'ai-inputs/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'input-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit for images/videos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/avi'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

// Waste classification using YOLOv8
router.post('/classify-waste', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const imagePath = req.file.path;
    const imageName = req.file.filename;

    // Call Python script for YOLOv8 classification
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../ml_models/waste_classifier.py'),
      '--image', imagePath,
      '--model', 'yolov8n.pt'
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
      if (code !== 0) {
        console.error('Python process error:', error);
        return res.status(500).json({ 
          error: 'Failed to classify waste',
          details: error
        });
      }

      try {
        const classificationResult = JSON.parse(result);
        res.json({
          message: 'Waste classification completed',
          image: imageName,
          results: classificationResult
        });
      } catch (parseError) {
        console.error('Error parsing Python output:', parseError);
        res.status(500).json({ 
          error: 'Failed to parse classification results',
          rawOutput: result
        });
      }
    });

  } catch (error) {
    console.error('Error in waste classification:', error);
    res.status(500).json({ error: 'Classification failed' });
  }
});

// Waste analysis using Groq API
router.post('/analyze-waste', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const imagePath = req.file.path;
    const imageName = req.file.filename;

    // Call Python script for Groq API analysis
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../ml_models/waste_analyzer.py'),
      '--image', imagePath,
      '--api-key', process.env.GROQ_API_KEY || ''
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
      if (code !== 0) {
        console.error('Python process error:', error);
        return res.status(500).json({ 
          error: 'Failed to analyze waste',
          details: error
        });
      }

      try {
        const analysisResult = JSON.parse(result);
        res.json({
          message: 'Waste analysis completed',
          image: imageName,
          analysis: analysisResult
        });
      } catch (parseError) {
        console.error('Error parsing Python output:', parseError);
        res.status(500).json({ 
          error: 'Failed to parse analysis results',
          rawOutput: result
        });
      }
    });

  } catch (error) {
    console.error('Error in waste analysis:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Batch processing for multiple images
router.post('/batch-classify', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }

    const imagePaths = req.files.map(file => file.path);
    const imageNames = req.files.map(file => file.filename);

    // Call Python script for batch processing
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../ml_models/batch_classifier.py'),
      '--images', JSON.stringify(imagePaths),
      '--model', 'yolov8n.pt'
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
      if (code !== 0) {
        console.error('Python process error:', error);
        return res.status(500).json({ 
          error: 'Failed to process batch',
          details: error
        });
      }

      try {
        const batchResults = JSON.parse(result);
        res.json({
          message: 'Batch classification completed',
          images: imageNames,
          results: batchResults
        });
      } catch (parseError) {
        console.error('Error parsing Python output:', parseError);
        res.status(500).json({ 
          error: 'Failed to parse batch results',
          rawOutput: result
        });
      }
    });

  } catch (error) {
    console.error('Error in batch classification:', error);
    res.status(500).json({ error: 'Batch processing failed' });
  }
});

// Get AI model status and health
router.get('/status', async (req, res) => {
  try {
    // Check if Python ML models are available
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../ml_models/health_check.py')
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
      if (code !== 0) {
        return res.json({
          status: 'unhealthy',
          models: {
            yolov8: 'unavailable',
            groq: 'unavailable'
          },
          error: error
        });
      }

      try {
        const healthStatus = JSON.parse(result);
        res.json({
          status: 'healthy',
          models: healthStatus,
          timestamp: new Date().toISOString()
        });
      } catch (parseError) {
        res.json({
          status: 'unknown',
          models: {
            yolov8: 'unknown',
            groq: 'unknown'
          },
          error: 'Failed to parse health check'
        });
      }
    });

  } catch (error) {
    console.error('Error checking AI status:', error);
    res.status(500).json({ error: 'Failed to check AI status' });
  }
});

module.exports = router; 