import * as dotenv from 'dotenv';
dotenv.config();

import { uploadBuffer } from '../utils/cloudinary';

const images = [
  {
    name: 'wolf',
    url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/642265051/medium.jpg',
  },
  {
    name: 'crocodile',
    url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/642253554/medium.jpg',
  },
];

async function main() {
  for (const img of images) {
    console.log(`Downloading ${img.name} from Wikimedia...`);
    const res = await fetch(img.url, {
      headers: { 'User-Agent': 'WildTrack/1.0 (seed script)' },
    });
    if (!res.ok) throw new Error(`Failed to download ${img.name}: HTTP ${res.status}`);

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`  Downloaded ${buffer.byteLength} bytes`);

    console.log(`  Uploading to Cloudinary...`);
    const cloudinaryUrl = await uploadBuffer(buffer, 'image/jpeg');
    console.log(`  ${img.name.toUpperCase()} URL: ${cloudinaryUrl}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
