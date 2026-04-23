const { spawn } = require('child_process');

const PHONE_NUMBER = '255778286840'; // your number here

function startBot() {
  console.log('🚀 Starting bot...');
  
  const bot = spawn('node', ['/home/container/bot.js'], { // ← real bot
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