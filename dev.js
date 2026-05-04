import { spawn } from 'child_process';
import fs from 'fs';

// Write .dev.vars based on process.env
const devVars = [];
if (process.env.ADMIN_PASSWORD) devVars.push(`ADMIN_PASSWORD=${process.env.ADMIN_PASSWORD}`);
if (process.env.JWT_SECRET) devVars.push(`JWT_SECRET=${process.env.JWT_SECRET}`);
if (process.env.GEMINI_API_KEY) devVars.push(`GEMINI_API_KEY=${process.env.GEMINI_API_KEY}`);

// Write the variables to .dev.vars so Wrangler picks them up
fs.writeFileSync('.dev.vars', devVars.join('\n'));

// Start the dev server
const cmd = /^win/.test(process.platform) ? 'npx.cmd' : 'npx';
const args = [
  "wrangler", "pages", "dev", 
  "--d1", "DB=lifeteller_db", 
  "--compatibility-flag=nodejs_compat", 
  "--port", "3000", 
  "--ip", "0.0.0.0", 
  "--proxy", "5173", 
  "--", "npx", "vite", "--port", "5173", "--host", "0.0.0.0"
];

const child = spawn(cmd, args, { stdio: 'inherit' });
child.on('close', code => process.exit(code));
