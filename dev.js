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

// Log that we are starting vite
console.log('Starting Vite server...');
const vite = spawn(cmd, ["vite", "--port", "5173", "--host", "127.0.0.1"], { stdio: 'inherit' });

// Log that we are starting wrangler
console.log('Starting Wrangler proxy...');
const wranglerArgs = [
  "wrangler", "pages", "dev", 
  "--d1", "DB=lifeteller_db", 
  "--compatibility-flags=nodejs_compat", 
  "--port", "3000", 
  "--ip", "0.0.0.0", 
  "--proxy", "5173"
];

// Give Vite a little time to start before starting Wrangler
setTimeout(() => {
  const wrangler = spawn(cmd, wranglerArgs, { stdio: 'inherit' });
  
  wrangler.on('close', code => {
    vite.kill();
    process.exit(code);
  });
}, 2000);

// Cleanup
process.on('SIGINT', () => {
    vite.kill();
    process.exit();
});
process.on('SIGTERM', () => {
    vite.kill();
    process.exit();
});

