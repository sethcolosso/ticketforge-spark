import fs from 'fs';
import path from 'path';

const lockFile = path.join(process.cwd(), 'package-lock.json');
const nodeModules = path.join(process.cwd(), 'node_modules');

try {
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
    console.log('[v0] Deleted package-lock.json');
  }
  
  if (fs.existsSync(nodeModules)) {
    fs.rmSync(nodeModules, { recursive: true, force: true });
    console.log('[v0] Deleted node_modules');
  }
  
  console.log('[v0] Cleanup complete');
} catch (error) {
  console.error('[v0] Cleanup error:', error.message);
}
