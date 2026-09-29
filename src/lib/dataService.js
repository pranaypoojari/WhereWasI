import fs from 'fs';
import os from 'os';
import path from 'path';
import clientPromise from './mongodb';

const SEED_DIR = path.join(process.cwd(), 'data', 'seed');
const TMP_GEN_PATH = path.join(os.tmpdir(), 'wherewasi_generated_shows.json');

// Global in-memory cache for serverless warm instances
if (!globalThis.__WHEREWASI_MEM_CACHE__) {
  globalThis.__WHEREWASI_MEM_CACHE__ = {};
}

function readLocalSeed(filename) {
  try {
    const filePath = path.join(SEED_DIR, filename);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading seed file ${filename}:`, err);
    return null;
  }
}

function readGeneratedCache() {
  const combined = { ...(readLocalSeed('generated_shows.json') || {}) };
  try {
    if (fs.existsSync(TMP_GEN_PATH)) {
      const tmpData = JSON.parse(fs.readFileSync(TMP_GEN_PATH, 'utf-8'));
      Object.assign(combined, tmpData);
    }
  } catch (e) {
    // Ignore tmp read errors
  }
  Object.assign(combined, globalThis.__WHEREWASI_MEM_CACHE__);
  return combined;
}

function writeGeneratedCache(genData) {
  globalThis.__WHEREWASI_MEM_CACHE__ = genData;
  try {
    const genPath = path.join(SEED_DIR, 'generated_shows.json');
    fs.writeFileSync(genPath, JSON.stringify(genData, null, 2), 'utf-8');
  } catch (err) {
    // Expected on read-only serverless filesystems (e.g., Vercel); fallback to os.tmpdir()
    try {
      fs.writeFileSync(TMP_GEN_PATH, JSON.stringify(genData, null, 2), 'utf-8');
    } catch (tmpErr) {
      // In-memory cache still holds it
    }
  }
}

function writeLocalRequests(requests) {
  try {
    const filePath = path.join(SEED_DIR, 'requests.json');
    fs.writeFileSync(filePath, JSON.stringify(requests, null, 2), 'utf-8');
  } catch (err) {
    // Read-only filesystem safe ignore
  }
}

function getAllLocalShows() {
  const shows = [];
  try {
    if (fs.existsSync(SEED_DIR)) {
      const files = fs.readdirSync(SEED_DIR);
      for (const file of files) {
        if (!file.endsWith('.json') || file === 'requests.json' || file === 'generated_shows.json') continue;
        const data = readLocalSeed(file);
        if (data && data.show && !shows.some(s => s.slug === data.show.slug)) {
          shows.push(data.show);
        }
      }
    }
    const genData = readGeneratedCache();
    if (genData) {
      Object.values(genData).forEach(item => {
        if (item && item.show && !shows.some(s => s.slug === item.show.slug)) {
          shows.push(item.show);
        }
      });
    }
  } catch (err) {
    console.error('Error reading local seed directory:', err);
  }
  return shows;
}

function getLocalShowData(slug) {
  // Check exact file match first
  const exactFile = readLocalSeed(`${slug}.json`);
  if (exactFile && exactFile.show) return exactFile;

  // Check generated cache (local + tmp + memory)
  const genData = readGeneratedCache();
  if (genData && genData[slug]) {
    return genData[slug];
  }

  // Scan all seed files for matching slug
  try {
    if (fs.existsSync(SEED_DIR)) {
      const files = fs.readdirSync(SEED_DIR);
      for (const file of files) {
        if (!file.endsWith('.json') || file === 'requests.json' || file === 'generated_shows.json') continue;
        const data = readLocalSeed(file);
        if (data && data.show && data.show.slug === slug) {
          return data;
        }
      }
    }
  } catch (err) {
    console.error('Error finding local show data:', err);
  }
  return null;
}

export async function saveDynamicShow(show) {
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db('wherewasi');
      await db.collection('shows').updateOne(
        { slug: show.slug },
        { $set: show },
        { upsert: true }
      );
    } catch (err) {
      console.warn('MongoDB saveDynamicShow failed, saving locally:', err.message);
    }
  }

  try {
    const genData = readGeneratedCache();
    genData[show.slug] = genData[show.slug] || { show, characters: [], recaps: [] };
    genData[show.slug].show = show;
    writeGeneratedCache(genData);
  } catch (err) {
    console.error('Failed saving generated show:', err);
  }
}

export async function saveDynamicRecap(showSlug, recapData) {
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db('wherewasi');
      await db.collection('recaps').updateOne(
        { showSlug, season: recapData.season, episode: recapData.episode },
        { $set: { ...recapData, showSlug } },
        { upsert: true }
      );
    } catch (err) {
      console.warn('MongoDB saveDynamicRecap failed:', err.message);
    }
  }

  try {
    const genData = readGeneratedCache();
    if (genData[showSlug]) {
      const existingIdx = genData[showSlug].recaps.findIndex(
        r => r.season === recapData.season && r.episode === recapData.episode
      );
      if (existingIdx >= 0) {
        genData[showSlug].recaps[existingIdx] = recapData;
      } else {
        genData[showSlug].recaps.push(recapData);
      }
      writeGeneratedCache(genData);
    }
  } catch (err) {
    console.error('Failed updating local generated recap:', err);
  }
}



export async function getAllShows() {
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db('wherewasi');
      const shows = await db.collection('shows').find({ isPublished: true }).toArray();
      if (shows && shows.length > 0) return shows;
    } catch (err) {
      console.warn('MongoDB query failed, falling back to local seed data:', err.message);
    }
  }
  return getAllLocalShows();
}

export async function getShowBySlug(slug) {
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db('wherewasi');
      const show = await db.collection('shows').findOne({ slug });
      if (show) return show;
    } catch (err) {
      console.warn('MongoDB query failed for slug, falling back to local seed:', err.message);
    }
  }
  const data = getLocalShowData(slug);
  return data ? data.show : null;
}

export async function getFullShowDetails(slug) {
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db('wherewasi');
      const show = await db.collection('shows').findOne({ slug });
      if (show) {
        const characters = await db.collection('characters').find({ showSlug: slug }).toArray();
        const recaps = await db.collection('recaps').find({ showSlug: slug }).toArray();
        return { show, characters, recaps };
      }
    } catch (err) {
      console.warn('MongoDB fetch error, falling back to local seed:', err.message);
    }
  }
  return getLocalShowData(slug);
}

export {
  computeCharacterStatuses,
  computeRelationships,
  getRecapForEpisode
} from './timelineUtils';


export async function getShowRequests() {
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db('wherewasi');
      const reqs = await db.collection('show_requests').find().sort({ votes: -1 }).toArray();
      if (reqs && reqs.length > 0) return reqs;
    } catch (err) {
      console.warn('MongoDB show_requests failed, falling back:', err.message);
    }
  }
  const data = readLocalSeed('requests.json');
  return data || [];
}

export async function submitShowRequest(title, genre, platform, requestedBy) {
  const newReq = {
    id: `req-${Date.now()}`,
    title,
    genre: genre || "General",
    platform: platform || "OTT",
    requestedBy: requestedBy || "Anonymous Cinephile",
    votes: 1,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db('wherewasi');
      await db.collection('show_requests').insertOne(newReq);
      return newReq;
    } catch (err) {
      console.warn('Failed inserting to MongoDB, saving locally:', err.message);
    }
  }

  const existing = (await getShowRequests()) || [];
  existing.unshift(newReq);
  writeLocalRequests(existing);
  return newReq;
}

export async function voteForShowRequest(id) {
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db('wherewasi');
      await db.collection('show_requests').updateOne({ id }, { $inc: { votes: 1 } });
    } catch (err) {
      console.warn('Failed voting in MongoDB, updating locally:', err.message);
    }
  }

  const existing = (await getShowRequests()) || [];
  const target = existing.find(r => r.id === id);
  if (target) {
    target.votes = (target.votes || 0) + 1;
    writeLocalRequests(existing);
    return target;
  }
  return null;
}
