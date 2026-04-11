// api/spin.js

const fs = require('fs');
const path = require('path');

// Storage files
const RAFFLE_FILE = path.join(__dirname, '../data/raffle_entries.json');
const SPIN_HISTORY_FILE = path.join(__dirname, '../data/spin_history.json');
const DATA_DIR = path.join(__dirname, '../data');

// Admin API key (only this key can perform spin)
const ADMIN_API_KEY = "selovasx2024";

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Mask phone number (show only first 2 and last 2 digits)
function maskPhoneNumber(number) {
  if (!number) return "N/A";
  const str = number.toString();
  if (str.length <= 4) return "•••••••••";
  const firstTwo = str.substring(0, 2);
  const lastTwo = str.substring(str.length - 2);
  const middleLength = str.length - 4;
  const masked = firstTwo + "•".repeat(middleLength) + lastTwo;
  return masked;
}

// Mask GCash name (show only first letter and last letter)
function maskGcashName(name) {
  if (!name) return "N/A";
  if (name.length <= 2) return name[0] + "•";
  const first = name[0];
  const last = name[name.length - 1];
  return first + "•••" + last;
}

// Load raffle entries
function loadEntries() {
  if (!fs.existsSync(RAFFLE_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(RAFFLE_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

// Save raffle entries
function saveEntries(entries) {
  fs.writeFileSync(RAFFLE_FILE, JSON.stringify(entries, null, 2));
}

// Load spin history
function loadSpinHistory() {
  if (!fs.existsSync(SPIN_HISTORY_FILE)) {
    return { spins: [], winners: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(SPIN_HISTORY_FILE, 'utf8'));
  } catch (e) {
    return { spins: [], winners: [] };
  }
}

// Save spin history
function saveSpinHistory(data) {
  fs.writeFileSync(SPIN_HISTORY_FILE, JSON.stringify(data, null, 2));
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

module.exports = {
  meta: {
    name: "Raffle Spin",
    description: "Spin to randomly pick ONE winner from all participants",
    author: "Jaybohol",
    version: "1.0.0",
    category: "game",
    method: "GET",
    path: "/spin?action="
  },
  
  onStart: async function({ req, res }) {
    try {
      const { action, name, gcashnumber, gcashname, reset, apikey } = req.query;
      
      // Check if admin (has valid API key)
      const isAdmin = (apikey === ADMIN_API_KEY);
      
      // Handle join raffle (no API key required)
      if (action === 'join') {
        if (!name) {
          return res.status(400).json({
            status: false,
            error: "Name is required",
            usage: "/spin?action=join&name=Jay%20Kizuu&gcashnumber=09916527333&gcashname=J...B"
          });
        }
        
        if (!gcashnumber) {
          return res.status(400).json({
            status: false,
            error: "GCash number is required"
          });
        }
        
        if (!gcashname) {
          return res.status(400).json({
            status: false,
            error: "GCash name is required"
          });
        }
        
        // Validate GCash number
        const cleanNumber = gcashnumber.toString().replace(/[\s\-+]/g, '');
        const isValidNumber = /^09\d{9}$/.test(cleanNumber) || /^639\d{9}$/.test(cleanNumber);
        
        if (!isValidNumber) {
          return res.status(400).json({
            status: false,
            error: "Invalid GCash number format. Use: 09916527333 or 639916527333"
          });
        }
        
        const entries = loadEntries();
        
        // Check for duplicate
        const existingEntry = entries.find(e => e.name.toLowerCase() === name.toLowerCase());
        
        if (existingEntry) {
          return res.status(409).json({
            status: false,
            error: "Name already registered",
            message: `"${name}" has already joined the raffle`
          });
        }
        
        // Create new entry
        const newEntry = {
          id: generateId(),
          name: name.trim(),
          gcashnumber: cleanNumber,
          gcashname: gcashname.trim(),
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0]
        };
        
        entries.push(newEntry);
        saveEntries(entries);
        
        return res.json({
          status: true,
          message: "✅ Successfully joined the raffle!",
          entry: {
            name: newEntry.name,
            gcash_number: maskPhoneNumber(newEntry.gcashnumber),
            gcash_name: maskGcashName(newEntry.gcashname),
            entry_number: entries.length
          },
          total_participants: entries.length,
          note: "Your number is hidden from public view. Only admins can see full details."
        });
      }
      
      // Handle list participants (no API key required for public view)
      if (action === 'list') {
        const entries = loadEntries();
        
        if (entries.length === 0) {
          return res.json({
            status: true,
            message: "No participants yet",
            total_participants: 0,
            participants: []
          });
        }
        
        // Create masked entries for public view
        const maskedParticipants = entries.map((entry, index) => ({
          number: index + 1,
          name: entry.name,
          gcash_number: maskPhoneNumber(entry.gcashnumber),
          gcash_name: maskGcashName(entry.gcashname),
          joined_at: entry.timestamp
        }));
        
        // If admin, also provide full details
        let fullParticipants = null;
        if (isAdmin) {
          fullParticipants = entries.map((entry, index) => ({
            number: index + 1,
            id: entry.id,
            name: entry.name,
            gcash_number: entry.gcashnumber,
            gcash_name: entry.gcashname,
            joined_at: entry.timestamp
          }));
        }
        
        return res.json({
          status: true,
          message: isAdmin ? "Participants retrieved (Admin View - Full Details)" : "Participants retrieved (Public View - Masked)",
          is_admin: isAdmin,
          total_participants: entries.length,
          participants: maskedParticipants,
          ...(isAdmin && { full_participants: fullParticipants, admin_note: "Use apikey=selovasx2024 to see full numbers" })
        });
      }
      
      // Handle reset (clear all participants) - admin only
      if (action === 'reset' && reset === 'true') {
        if (!isAdmin) {
          return res.status(403).json({
            status: false,
            error: "Unauthorized. Only admin can reset the raffle.",
            message: "Please provide valid apikey to reset."
          });
        }
        
        saveEntries([]);
        
        return res.json({
          status: true,
          message: "Raffle has been reset. All participants cleared."
        });
      }
      
      // Handle spin - pick ONE random winner (API KEY REQUIRED)
      if (action === 'spin') {
        // Check if API key is provided
        if (!apikey) {
          return res.status(401).json({
            status: false,
            error: "API key is required to spin",
            message: "Please provide apikey= to spin the raffle.",
            usage: "/spin?action=spin&apikey="
          });
        }
        
        // Validate API key
        if (apikey !== ADMIN_API_KEY) {
          return res.status(403).json({
            status: false,
            error: "Invalid API key",
            message: "The provided API key is not valid."
          });
        }
        
        const entries = loadEntries();
        
        if (entries.length === 0) {
          return res.status(400).json({
            status: false,
            error: "No participants found. Please ask people to join first.",
            instruction: "Use: /spin?action=join&name=YourName&gcashnumber=09916527333&gcashname=YourGCashName"
          });
        }
        
        // Check if spin already done today
        const spinHistory = loadSpinHistory();
        if (spinHistory.last_winner && spinHistory.last_winner.date === new Date().toISOString().split('T')[0]) {
          const winner = spinHistory.last_winner.winner;
          return res.json({
            status: false,
            error: "Spin already done today!",
            message: "The winner has already been selected for today.",
            winner: {
              name: winner.name,
              gcash_number: maskPhoneNumber(winner.gcashnumber),
              gcash_name: maskGcashName(winner.gcashname),
              prize: "₱50 GCash"
            }
          });
        }
        
        // Randomly select ONE winner
        const randomIndex = Math.floor(Math.random() * entries.length);
        const winner = entries[randomIndex];
        const winnerNumber = randomIndex + 1;
        
        // Generate spin animation result
        const spinResult = {
          spinId: generateId(),
          winner: winner,
          winner_number: winnerNumber,
          total_participants: entries.length,
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0]
        };
        
        // Save to spin history
        spinHistory.spins.unshift(spinResult);
        spinHistory.last_winner = spinResult;
        if (spinHistory.winners) {
          spinHistory.winners.unshift({
            name: winner.name,
            gcash_number: winner.gcashnumber,
            gcash_name: winner.gcashname,
            prize: "₱50 GCash",
            amount: 50,
            date: spinResult.timestamp,
            entry_number: winnerNumber
          });
        } else {
          spinHistory.winners = [{
            name: winner.name,
            gcash_number: winner.gcashnumber,
            gcash_name: winner.gcashname,
            prize: "₱50 GCash",
            amount: 50,
            date: spinResult.timestamp,
            entry_number: winnerNumber
          }];
        }
        
        saveSpinHistory(spinHistory);
        
        // Visual wheel animation
        const wheelVisual = `
╔════════════════════════════════════════╗
║                                        ║
║           🎰 SPINNING... 🎰            ║
║                                        ║
║     ┌─────────────────────────┐        ║
║     │                         │        ║
║     │    🏆 WINNER FOUND! 🏆   │        ║
║     │                         │        ║
║     └─────────────────────────┘        ║
║                    ▼                    ║
║                                        ║
║   ╔═══════════════════════════════╗    ║
║   ║                               ║    ║
║   ║      ${winner.name.toUpperCase().padEnd(20)}      ║    ║
║   ║                               ║    ║
║   ║      WINS ₱50 GCASH!          ║    ║
║   ║                               ║    ║
║   ╚═══════════════════════════════╝    ║
║                                        ║
╚════════════════════════════════════════╝
        `;
        
        return res.json({
          status: true,
          success: true,
          message: `🎉🎊 CONGRATULATIONS ${winner.name}! 🎊🎉\nYou won ₱50 GCash! 💰`,
          spin: {
            spin_id: spinResult.spinId,
            winner_name: winner.name,
            winner_gcash: winner.gcashnumber,
            winner_gcash_name: winner.gcashname,
            entry_number: winnerNumber,
            prize: "₱50 GCash",
            total_participants: entries.length
          },
          visual: wheelVisual,
          timestamp: spinResult.timestamp
        });
      }
      
      // Handle winner check (no API key required for public view)
      if (action === 'winner') {
        const spinHistory = loadSpinHistory();
        
        if (!spinHistory.last_winner) {
          return res.json({
            status: true,
            message: "No spin has been done yet. Use /spin?action=spin&apikey=selovasx2024 to pick a winner!"
          });
        }
        
        const winner = spinHistory.last_winner.winner;
        
        return res.json({
          status: true,
          winner: {
            name: winner.name,
            gcash_number: isAdmin ? winner.gcashnumber : maskPhoneNumber(winner.gcashnumber),
            gcash_name: isAdmin ? winner.gcashname : maskGcashName(winner.gcashname),
            prize: "₱50 GCash",
            entry_number: spinHistory.last_winner.winner_number
          },
          date: spinHistory.last_winner.date,
          total_participants: spinHistory.last_winner.total_participants,
          is_admin: isAdmin
        });
      }
      
      // Default response - show available actions
      res.json({
        status: true,
        message: "🎰 RAFFLE SPIN SYSTEM 🎰",
        available_actions: {
          join: "/spin?action=join&name=YourName&gcashnumber=09916527333&gcashname=YourGCashName",
          list_public: "/spin?action=list",
          list_admin: "/spin?action=list&apikey=",
          spin: "/spin?action=spin&apikey=",
          winner: "/spin?action=winner",
          winner_admin: "/spin?action=winner&apikey=",
          reset: "/spin?action=reset&reset=true&apikey="
        },
        current_participants: loadEntries().length,
        note: "API key required for spin action. Use apikey=selovasx2024"
      });
      
    } catch (error) {
      console.error("Spin API Error:", error.message);
      
      res.status(500).json({
        status: false,
        error: "Internal server error",
        details: error.message
      });
    }
  }
};
