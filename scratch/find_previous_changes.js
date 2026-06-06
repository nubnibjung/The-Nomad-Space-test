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
    if (obj.tool_calls) {
      for (const call of obj.tool_calls) {
        if (call.name === 'multi_replace_file_content' || call.name === 'replace_file_content') {
          console.log(`STEP ${obj.step_index} (${call.name}):`);
          console.log(JSON.stringify(call.args, null, 2));
          console.log('---');
        }
      }
    }
  } catch (e) {
    // ignore
  }
});
