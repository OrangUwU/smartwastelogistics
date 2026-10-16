const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'waste_logistics.json');

const INITIAL_HUBS = [
  {
    id: 1,
    name: 'Klaster 1 - Mawar (3 Rumah Komunal)',
    latitude: -8.2165,
    longitude: 114.3645,
    status: 'FULL',
    points: 50
  },
  {
    id: 2,
    name: 'Klaster 2 - Melati (Warung & Drop Point)',
    latitude: -8.223,
    longitude: 114.371,
    status: 'FULL',
    points: 40
  },
  {
    id: 3,
    name: 'Micro-Hub 3 - De Djawatan Eco Station',
    latitude: -8.228,
    longitude: 114.359,
    status: 'EMPTY',
    points: 10
  },
  {
    id: 4,
    name: 'Klaster 4 - Kampung Bethek Kuliner',
    latitude: -8.209,
    longitude: 114.378,
    status: 'EMPTY',
    points: 50
  }
];

// Helper to read hubs
function readData() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeData(INITIAL_HUBS);
      return INITIAL_HUBS;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading JSON DB, fallback to initial:', err.message);
    return INITIAL_HUBS;
  }
}

// Helper to write hubs
function writeData(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing JSON DB:', err.message);
  }
}

// Initialize on startup
if (!fs.existsSync(DB_PATH)) {
  console.log('🌱 Initializing persistent JSON database at:', DB_PATH);
  writeData(INITIAL_HUBS);
} else {
  console.log(' Connected to persistent database:', DB_PATH);
}

// Promise-based helper functions matching exact previous API interface
async function getAllHubs() {
  const hubs = readData();
  return hubs.sort((a, b) => a.id - b.id);
}

async function getHubById(id) {
  const hubs = readData();
  const hub = hubs.find((h) => h.id === Number(id));
  return hub || null;
}

async function updateHubStatusAndPoints(id, status = 'FULL', pointsDelta = 10) {
  const hubs = readData();
  const hubIndex = hubs.findIndex((h) => h.id === Number(id));

  if (hubIndex === -1) {
    throw new Error(`Hub with id ${id} not found.`);
  }

  hubs[hubIndex].status = status;
  hubs[hubIndex].points = (hubs[hubIndex].points || 0) + Number(pointsDelta);

  writeData(hubs);
  return hubs[hubIndex];
}

async function resetHubStatus(id) {
  const hubs = readData();
  const hubIndex = hubs.findIndex((h) => h.id === Number(id));

  if (hubIndex === -1) {
    throw new Error(`Hub with id ${id} not found.`);
  }

  hubs[hubIndex].status = 'EMPTY';
  writeData(hubs);
  return hubs[hubIndex];
}

module.exports = {
  getAllHubs,
  getHubById,
  updateHubStatusAndPoints,
  resetHubStatus
};
