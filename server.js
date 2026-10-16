const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');
const {
  getAllHubs,
  getHubById,
  updateHubStatusAndPoints,
  resetHubStatus
} = require('./database');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static dashboard files from "public"
app.use(express.static(path.join(__dirname, 'public')));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`⚡ Client connected via Socket.io: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

/**
 * GET /api/hubs
 * Returns all waste hubs from SQLite
 */
app.get('/api/hubs', async (req, res) => {
  try {
    const hubs = await getAllHubs();
    res.json({
      success: true,
      data: hubs
    });
  } catch (error) {
    console.error('Error fetching hubs:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hubs from database'
    });
  }
});

/**
 * GET /webhook/whatsapp
 * Required by Meta to verify webhook endpoint with hub.challenge
 */
app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'smartwaste_token_2026';

  if (mode && token === VERIFY_TOKEN) {
    console.log('✅ Meta Webhook verified successfully!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

/**
 * POST /webhook/whatsapp
 * Handles incoming WhatsApp webhook messages (Meta, Twilio, and direct JSON)
 */
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    // Extract message body from various possible webhook formats
    const incomingText =
      req.body?.message ||
      req.body?.Body ||
      req.body?.text ||
      req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body ||
      (typeof req.body === 'string' ? req.body : '');

    console.log(`📩 Received WhatsApp Webhook payload: "${incomingText}"`, req.body);

    if (!incomingText || typeof incomingText !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing message content in webhook payload. Format expected: "PENUH <hub_id>"'
      });
    }

    const trimmed = incomingText.trim();

    // 1. Check for "PENUH" or "PENUH <id>" command
    const penuhMatch = trimmed.match(/^PENUH(?:\s+(\d+))?$/i);

    if (penuhMatch) {
      let hubId = penuhMatch[1] ? parseInt(penuhMatch[1], 10) : null;

      // If just "PENUH" without ID, find the first hub that is currently EMPTY, or fallback to Hub 1
      if (!hubId) {
        const allHubs = await getAllHubs();
        const emptyHub = allHubs.find((h) => h.status === 'EMPTY');
        hubId = emptyHub ? emptyHub.id : 1;
      }

      // Check if hub exists
      const existingHub = await getHubById(hubId);
      if (!existingHub) {
        return res.status(404).json({
          success: false,
          error: `Hub with ID ${hubId} was not found.`
        });
      }

      // a. Update status to 'FULL'
      // b. Add 10 points
      const updatedHub = await updateHubStatusAndPoints(hubId, 'FULL', 10);

      console.log(`🚨 Hub ${hubId} (${updatedHub.name}) marked as FULL! Points updated to ${updatedHub.points}`);

      // c. Emit Socket.io event 'route_update'
      io.emit('route_update', updatedHub);

      return res.status(200).json({
        success: true,
        message: `Hub ${hubId} reported FULL. Status updated and +10 points awarded.`,
        hub: updatedHub
      });
    }

    // Optional convenience command for demo/testing: "KOSONG <id>" or "EMPTY <id>"
    const kosongMatch = trimmed.match(/^(?:KOSONG|EMPTY)\s+(\d+)$/i);
    if (kosongMatch) {
      const hubId = parseInt(kosongMatch[1], 10);
      const updatedHub = await resetHubStatus(hubId);

      console.log(`♻️ Hub ${hubId} reset to EMPTY status.`);
      io.emit('route_update', updatedHub);

      return res.status(200).json({
        success: true,
        message: `Hub ${hubId} reset to EMPTY.`,
        hub: updatedHub
      });
    }

    // Non-matching message
    return res.status(400).json({
      success: false,
      error: `Unrecognized message command: "${incomingText}". Use format "PENUH <id>" (e.g., "PENUH 1").`
    });
  } catch (error) {
    console.error('❌ Error processing WhatsApp webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while processing webhook'
    });
  }
});

/**
 * POST /api/hubs/:id/reset
 * Helper endpoint to reset hub status back to 'EMPTY' for easy dashboard testing
 */
app.post('/api/hubs/:id/reset', async (req, res) => {
  try {
    const hubId = parseInt(req.params.id, 10);
    const updatedHub = await resetHubStatus(hubId);

    // Emit update event to clients
    io.emit('route_update', updatedHub);

    res.json({
      success: true,
      message: `Hub ${hubId} reset to EMPTY`,
      hub: updatedHub
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 10021;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Smart Waste Logistics Server running at http://0.0.0.0:${PORT}`);
  console.log(`🗺️  Dashboard: http://localhost:${PORT}`);
  console.log(`📡 WhatsApp Webhook URL: http://localhost:${PORT}/webhook/whatsapp`);
});
