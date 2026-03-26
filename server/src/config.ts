import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: parseInt(process.env.PORT || '3061', 10),
  dataDir: process.env.DATA_DIR || path.join(__dirname, '../../data'),
};
