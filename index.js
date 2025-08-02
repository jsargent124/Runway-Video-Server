import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(express.json());

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;
const BASE_URL = 'https://api.runwayml.com/v2';

app.post('/generate-video', async (req, res) => {
  const { promptText } = req.body;

  if (!promptText) {
    return res.status(400).json({ error: 'Missing promptText' });
  }

  try {
    // Step 1: Create generation task
    const createRes = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json' // Added to handle API version requirements
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
    console.log(`🌀 Task created: ${taskId}`);

    // Step 2: Poll every 5 seconds for up to 2 minutes
    const pollForResult = async (retries = 24) => {
      for (let i = 0; i < retries; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const statusRes = await fetch(`${BASE_URL}/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${RUNWAY_API_KEY}`,
            'Accept': 'application/json'
          }
        });

        const statusData = await statusRes.json();

        if (statusData.status === 'succeeded') {
          return statusData;
        }

        if (statusData.status === 'failed') {
          throw new Error('Video generation failed.');
        }

        console.log(`⏳ Status: ${statusData.status}`);
      }

      throw new Error('Polling timeout — video not ready');
    };

    const result = await pollForResult();
    res.json({ message: 'Video ready!', result });

  } catch (error) {
    console.error('Server Error:', error.message);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
