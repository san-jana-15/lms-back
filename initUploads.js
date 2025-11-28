// initUploads.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initializes upload directories BEFORE routes load.
 * This is REQUIRED for Render and ESM projects.
 */
export function initUploads() {
  const uploadsRoot = path.join(__dirname, "uploads");
  const recordingsDir = path.join(uploadsRoot, "recordings");

  try {
    if (!fs.existsSync(uploadsRoot)) {
      fs.mkdirSync(uploadsRoot);
      console.log("📁 Created /uploads");
    }

    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
      console.log("📁 Created /uploads/recordings");
    }
  } catch (err) {
    console.error("❌ Failed to initialize upload folders:", err);
  }
}
