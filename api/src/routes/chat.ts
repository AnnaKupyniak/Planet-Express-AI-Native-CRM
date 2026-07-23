import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';

const router = Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { prompt } = req.body;
  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  const scriptPath = path.resolve(__dirname, '../../../agent/main.py');
  const agentDir = path.dirname(scriptPath);

  const pythonProcess = spawn('python3', [scriptPath, prompt], { cwd: agentDir });
  
  let output = '';
  let errorOutput = '';

  pythonProcess.on('error', (error) => {
    console.error('Failed to start python process:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Agent execution failed', details: error.message });
    }
  });

  pythonProcess.stdout.on('data', (data) => output += data.toString());
  pythonProcess.stderr.on('data', (data) => errorOutput += data.toString());

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      res.status(500).json({ error: 'Agent execution failed', details: errorOutput });
      return;
    }
    const finalAnswerMarker = "--- Фінальна відповідь ---";
    let finalResponse = output;
    if (output.includes(finalAnswerMarker)) {
       finalResponse = output.split(finalAnswerMarker)[1].trim();
       if (finalResponse.includes('✅ Trace збережено')) {
         finalResponse = finalResponse.split('✅ Trace збережено')[0].trim();
       }
    } else {
       finalResponse = output.trim();
    }
    res.json({ response: finalResponse, logs: output });
  });
});

export default router;
