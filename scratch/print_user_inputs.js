const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream('C:/Users/gidju/.gemini/antigravity-ide/brain/880eecc4-7b62-4e94-944f-fd8142e185fd/.system_generated/logs/transcript.jsonl');

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT') {
      console.log(`STEP ${obj.step_index}: ${obj.content.split('\n')[1] || obj.content}`);
    }
  } catch (e) {
    // ignore
  }
});
