const fs = require('fs');
const content = fs.readFileSync('C:/Users/USER/Desktop/smartbankAI/src/pages/AIForexAdvisor.jsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
lines.forEach((line, idx) => {
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div/g) || []).length;
  if (opens > 0 || closes > 0) {
    balance += opens - closes;
    console.log(`Line ${idx + 1}: Opens=${opens}, Closes=${closes}, Balance=${balance}`);
  }
});
if (balance !== 0) {
  console.log(`\nERROR: Final balance is ${balance}. Some div tags are unclosed.`);
} else {
  console.log(`\nSUCCESS: All div tags are balanced.`);
}
