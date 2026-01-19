
import { scrapeCustard } from './index.js';

// Mock req/res for local execution
const req = {};
const res = {
  status: (code) => ({
    send: (msg) => console.log(`[${code}] ${msg}`)
  })
};

scrapeCustard(req, res);
