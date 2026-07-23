const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.resolve(__dirname, '../../agent/main.py');
const agentDir = path.dirname(scriptPath);

console.log("scriptPath:", scriptPath);
console.log("agentDir:", agentDir);

const pythonProcess = spawn('python', [scriptPath, "Який у нас екіпаж?"], { cwd: agentDir });

pythonProcess.stdout.on('data', (data) => console.log(data.toString()));
pythonProcess.stderr.on('data', (data) => console.error(data.toString()));

pythonProcess.on('close', (code) => {
    console.log("done:", code);
});
