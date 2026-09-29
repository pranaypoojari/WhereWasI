import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.log('ℹ️  No MONGODB_URI found in environment.');
  console.log('ℹ️  WhereWasI runs in seamless local seed mode automatically.');
  console.log('ℹ️  To seed MongoDB Atlas, set MONGODB_URI in .env.local and rerun this script.');
  process.exit(0);
}

const seedDir = path.join(process.cwd(), 'data', 'seed');

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db('wherewasi');
    const showsCol = db.collection('shows');
    const charsCol = db.collection('characters');
    const recapsCol = db.collection('recaps');
    const reqsCol = db.collection('show_requests');

    // Clean existing
    await showsCol.deleteMany({});
    await charsCol.deleteMany({});
    await recapsCol.deleteMany({});
    await reqsCol.deleteMany({});

    const files = ['mirzapur.json', 'panchayat.json', 'breaking-bad.json'];

    for (const f of files) {
      const fullPath = path.join(seedDir, f);
      if (fs.existsSync(fullPath)) {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        const { show, characters, recaps } = data;

        await showsCol.insertOne(show);
        console.log(`🎬 Seeded show: ${show.title}`);

        if (characters && characters.length > 0) {
          const charsWithSlug = characters.map(c => ({ ...c, showSlug: show.slug }));
          await charsCol.insertMany(charsWithSlug);
          console.log(`   └─ Seeded ${characters.length} characters`);
        }

        if (recaps && recaps.length > 0) {
          const recapsWithSlug = recaps.map(r => ({ ...r, showSlug: show.slug }));
          await recapsCol.insertMany(recapsWithSlug);
          console.log(`   └─ Seeded ${recaps.length} recap snapshots`);
        }
      }
    }

    const reqsPath = path.join(seedDir, 'requests.json');
    if (fs.existsSync(reqsPath)) {
      const reqs = JSON.parse(fs.readFileSync(reqsPath, 'utf-8'));
      if (reqs.length > 0) {
        await reqsCol.insertMany(reqs);
        console.log(`🗳️ Seeded ${reqs.length} community requests`);
      }
    }

    console.log('\n✨ Database seeding completed successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await client.close();
  }
}

seed();
