const fs = require('fs');
const path = require('path');

const videoDir = path.join(__dirname, '..', 'Images', 'Training', 'videos');
const publicDir = path.join(__dirname, '..', 'public', 'Images', 'Training');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// Sync newest 2 videos
const videos = fs.readdirSync(videoDir)
  .filter(f => f.endsWith('.webm'))
  .map(f => ({ name: f, time: fs.statSync(path.join(videoDir, f)).mtime.getTime() }))
  .sort((a, b) => b.time - a.time);

if (videos.length >= 2) {
  // We assume the 2 most recent are the ones we just generated (Staff then Manager or vice versa)
  // Let's copy them both for now. 
  // staff-walkthrough.webm and walkthrough.webm
  fs.copyFileSync(path.join(videoDir, videos[0].name), path.join(publicDir, 'staff-walkthrough.webm'));
  fs.copyFileSync(path.join(videoDir, videos[1].name), path.join(publicDir, 'walkthrough.webm'));
  console.log(`✅ Synced dual walkthroughs.`);
} else if (videos.length === 1) {
  fs.copyFileSync(path.join(videoDir, videos[0].name), path.join(publicDir, 'walkthrough.webm'));
  console.log(`✅ Synced single walkthrough.`);
}

console.log('✅ Asset sync complete.');
