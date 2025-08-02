import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(express.json());

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;
const BASE_URL = 'https://api.runwayml.com/v2';
const API_VERSION = '2024-05-01'; // ✅ REQUIRED to avoid "Invalid API Version" errors

// POST /generate-video
app.post('/generate-video', async (req, res) => {
  const { promptText } = req.body;

  if (!promptText) {
    return res.status(400).json({ error: 'Missing promptText' });
  }

  try {
    const createRes = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': API_VERSION
      },
      body: JSON.stringify({
        model: 'stability-ai/gen-2',
        input: {
          prompt: promptText,
          duration: 4,
          width: 1024,
          height: 576
        }
      })
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      console.error('Runway Create Error:', createData);
      return res.status(500).json({ error: createData.error || 'Failed to create generation task' });
    }

    const taskId = createData.id;
    res.json({ message: 'Task created', taskId });

  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /video-status/:taskId
app.get('/video-status/:taskId', async (req, res) => {
  const { taskId } = req.params;

  try {
    const statusRes = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Version': API_VERSION
      }
    });

    const statusData = await statusRes.json();

    if (!statusRes.ok) {
      return res.status(500).json({ error: statusData.error || 'Error fetching task status' });
    }

    res.json(statusData);
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
