const { spawn } = require('child_process');
const path = require('path');

const PHONE_NUMBER = '255778286840'; // your number here

function startBot() {
  console.log('🚀 Starting bot...');
  
  // Use path.join to correctly locate bot.js in the current directory
  const botPath = path.join(__dirname, 'bot.js');
  
  console.log(`Looking for bot at: ${botPath}`);
  
  const bot = spawn('node', [botPath], { 
    stdio: ['pipe', 'pipe', 'pipe']
  });

  bot.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);

    if (output.includes('Enter your WhatsApp number')) {
      console.log('🤖 Auto-entering phone number...');
      bot.stdin.write(PHONE_NUMBER + '\n');
    }
  });

  bot.stderr.on('data', (data) => {
    process.stderr.write(data.toString());
  });

  bot.on('close', (code) => {
    console.log(`Bot process ended with code ${code}`);
  });
}

startBot();