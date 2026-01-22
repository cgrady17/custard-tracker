import { scrapeCustard } from './index.js';

console.log("🏃 Running local scrape to generate metadata...");

// Mock req/res for the Cloud Function
const req = {};
const res = {
  status: (code) => ({
    send: (msg) => console.log(`Response [${code}]: ${msg}`)
  })
};

scrapeCustard(req, res).catch(console.error);
