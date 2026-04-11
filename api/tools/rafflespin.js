// api/spin.js

const fs = require('fs');
const path = require('path');

// Storage files
const RAFFLE_FILE = path.join(__dirname, '../data/raffle_entries.json');
const SPIN_HISTORY_FILE = path.join(__dirname, '../data/spin_history.json');
const DATA_DIR = path.join(__dirname, '../data');

// Admin API key
const ADMIN_API_KEY = "selovasx2024";

// Prize settings
const TOTAL_PRIZE = 200;
const PRIZE_PER_WINNER = 50;
const TOTAL_WINNERS = 4;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Mask phone number
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

// Mask GCash name
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
    return { spins: [], winners: [], last_spin_index: 0 };
  }
  try {
    return JSON.parse(fs.readFileSync(SPIN_HISTORY_FILE, 'utf8'));
  } catch (e) {
    return { spins: [], winners: [], last_spin_index: 0 };
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
    description: "Spin 4 times to pick 4 winners (₱50 each)",
    author: "Jaybohol",
    version: "2.0.0",
    category: "game",
    method: "GET",
    path: "/spin?action="
  },
  
  onStart: async function({ req, res }) {
    try {
      const { action, name, gcashnumber, gcashname, reset, apikey } = req.query;
      
      const isAdmin = (apikey === ADMIN_API_KEY);
      
      // Handle join raffle
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
        
        const cleanNumber = gcashnumber.toString().replace(/[\s\-+]/g, '');
        const isValidNumber = /^09\d{9}$/.test(cleanNumber) || /^639\d{9}$/.test(cleanNumber);
        
        if (!isValidNumber) {
          return res.status(400).json({
            status: false,
            error: "Invalid GCash number format. Use: 09916527333 or 639916527333"
          });
        }
        
        const entries = loadEntries();
        const existingEntry = entries.find(e => e.name.toLowerCase() === name.toLowerCase());
        
        if (existingEntry) {
          return res.status(409).json({
            status: false,
            error: "Name already registered",
            message: `"${name}" has already joined the raffle`
          });
        }
        
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
          note: "4 winners will be selected. Each wins ₱50 GCash!"
        });
      }
      
      // Handle list participants
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
        
        const maskedParticipants = entries.map((entry, index) => ({
          number: index + 1,
          name: entry.name,
          gcash_number: maskPhoneNumber(entry.gcashnumber),
          gcash_name: maskGcashName(entry.gcashname),
          joined_at: entry.timestamp
        }));
        
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
        
        // Get spin status
        const spinHistory = loadSpinHistory();
        const winnersCount = spinHistory.winners.length;
        
        return res.json({
          status: true,
          message: isAdmin ? "Participants retrieved (Admin View)" : "Participants retrieved (Public View)",
          is_admin: isAdmin,
          total_participants: entries.length,
          spin_status: {
            total_winners: TOTAL_WINNERS,
            winners_found: winnersCount,
            remaining_winners: TOTAL_WINNERS - winnersCount,
            prize_per_winner: `₱${PRIZE_PER_WINNER}`,
            total_prize: `₱${TOTAL_PRIZE}`
          },
          participants: maskedParticipants,
          ...(isAdmin && { full_participants: fullParticipants })
        });
      }
      
      // Handle reset (clear all participants and spin history) - admin only
      if (action === 'reset' && reset === 'true') {
        if (!isAdmin) {
          return res.status(403).json({
            status: false,
            error: "Unauthorized. Only admin can reset."
          });
        }
        
        saveEntries([]);
        saveSpinHistory({ spins: [], winners: [], last_spin_index: 0 });
        
        return res.json({
          status: true,
          message: "Raffle has been reset. All participants and winners cleared."
        });
      }
      
      // Handle spin - pick ONE random winner (API KEY REQUIRED)
      if (action === 'spin') {
        if (!apikey) {
          return res.status(401).json({
            status: false,
            error: "API key is required to spin",
            usage: "/spin?action=spin&apikey="
          });
        }
        
        if (apikey !== ADMIN_API_KEY) {
          return res.status(403).json({
            status: false,
            error: "Invalid API key"
          });
        }
        
        const entries = loadEntries();
        
        if (entries.length === 0) {
          return res.status(400).json({
            status: false,
            error: "No participants found. Please ask people to join first."
          });
        }
        
        const spinHistory = loadSpinHistory();
        const currentWinners = spinHistory.winners.length;
        
        // Check if all 4 winners have been selected
        if (currentWinners >= TOTAL_WINNERS) {
          return res.json({
            status: false,
            error: "All 4 winners have already been selected!",
            message: `🎉 ${TOTAL_WINNERS} winners have already won ₱${PRIZE_PER_WINNER} each! Total ₱${TOTAL_PRIZE} awarded.`,
            winners: spinHistory.winners.map((w, index) => ({
              spin_number: index + 1,
              name: w.name,
              prize: w.prize
            }))
          });
        }
        
        // Get remaining participants (not yet winners)
        const winnerIds = new Set(spinHistory.winners.map(w => w.id));
        const remainingParticipants = entries.filter(entry => !winnerIds.has(entry.id));
        
        if (remainingParticipants.length === 0) {
          return res.status(400).json({
            status: false,
            error: "No remaining participants. All participants have already won!"
          });
        }
        
        // Randomly select ONE winner from remaining participants
        const randomIndex = Math.floor(Math.random() * remainingParticipants.length);
        const winner = remainingParticipants[randomIndex];
        const winnerNumber = entries.findIndex(e => e.id === winner.id) + 1;
        const spinNumber = currentWinners + 1;
        
        // Create spin result
        const spinResult = {
          spinId: generateId(),
          spin_number: spinNumber,
          winner: winner,
          winner_number: winnerNumber,
          prize: `₱${PRIZE_PER_WINNER} GCash`,
          amount: PRIZE_PER_WINNER,
          total_participants: entries.length,
          remaining_participants: remainingParticipants.length - 1,
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0]
        };
        
        // Save to spin history
        spinHistory.spins.unshift(spinResult);
        spinHistory.winners.push({
          id: winner.id,
          name: winner.name,
          gcash_number: winner.gcashnumber,
          gcash_name: winner.gcashname,
          prize: `₱${PRIZE_PER_WINNER} GCash`,
          amount: PRIZE_PER_WINNER,
          spin_number: spinNumber,
          date: spinResult.timestamp,
          entry_number: winnerNumber
        });
        spinHistory.last_spin_index = spinNumber;
        
        saveSpinHistory(spinHistory);
        
        // Visual wheel animation
        const wheelVisual = `
╔════════════════════════════════════════════╗
║                                            ║
║           🎰 SPIN #${spinNumber} OF ${TOTAL_WINNERS} 🎰           ║
║                                            ║
║     ┌─────────────────────────────┐        ║
║     │                             │        ║
║     │    🏆 WINNER FOUND! 🏆       │        ║
║     │                             │        ║
║     └─────────────────────────────┘        ║
║                    ▼                        ║
║                                            ║
║   ╔═══════════════════════════════════╗    ║
║   ║                                   ║    ║
║   ║      ${winner.name.toUpperCase().padEnd(20)}      ║    ║
║   ║                                   ║    ║
║   ║      WINS ₱${PRIZE_PER_WINNER} GCASH!        ║    ║
║   ║                                   ║    ║
║   ╚═══════════════════════════════════╝    ║
║                                            ║
║   🎊 ${spinNumber} of ${TOTAL_WINNERS} Winners Selected 🎊       ║
║                                            ║
╚════════════════════════════════════════════╝
        `;
        
        return res.json({
          status: true,
          success: true,
          spin_number: spinNumber,
          total_spins: TOTAL_WINNERS,
          message: `🎉🎊 SPIN #${spinNumber} - CONGRATULATIONS ${winner.name}! 🎊🎉\nYou won ₱${PRIZE_PER_WINNER} GCash! 💰`,
          winner: {
            spin_number: spinNumber,
            name: winner.name,
            gcash_number: winner.gcashnumber,
            gcash_name: winner.gcashname,
            entry_number: winnerNumber,
            prize: `₱${PRIZE_PER_WINNER} GCash`
          },
          remaining_spins: TOTAL_WINNERS - spinNumber,
          remaining_participants: remainingParticipants.length - 1,
          visual: wheelVisual,
          timestamp: spinResult.timestamp
        });
      }
      
      // Handle winners list
      if (action === 'winners') {
        const spinHistory = loadSpinHistory();
        
        if (spinHistory.winners.length === 0) {
          return res.json({
            status: true,
            message: "No winners yet. Use /spin?action=spin&apikey=selovasx2024 to start spinning!",
            total_winners: 0,
            expected_winners: TOTAL_WINNERS,
            prize_per_winner: `₱${PRIZE_PER_WINNER}`,
            total_prize: `₱${TOTAL_PRIZE}`
          });
        }
        
        const winnersList = spinHistory.winners.map((w, index) => ({
          spin_number: w.spin_number,
          name: w.name,
          gcash_number: isAdmin ? w.gcash_number : maskPhoneNumber(w.gcash_number),
          gcash_name: isAdmin ? w.gcash_name : maskGcashName(w.gcash_name),
          prize: w.prize,
          date: w.date
        }));
        
        return res.json({
          status: true,
          total_winners: spinHistory.winners.length,
          expected_winners: TOTAL_WINNERS,
          prize_per_winner: `₱${PRIZE_PER_WINNER}`,
          total_prize_awarded: `₱${spinHistory.winners.length * PRIZE_PER_WINNER}`,
          remaining_prize: `₱${(TOTAL_WINNERS - spinHistory.winners.length) * PRIZE_PER_WINNER}`,
          winners: winnersList,
          is_admin: isAdmin
        });
      }
      
      // Default response
      res.json({
        status: true,
        message: "🎰 4 WINNERS RAFFLE SPIN SYSTEM 🎰",
        description: `4 winners will be selected. Each wins ₱${PRIZE_PER_WINNER} GCash! Total ₱${TOTAL_PRIZE}!`,
        available_actions: {
          join: "/spin?action=join&name=YourName&gcashnumber=09916527333&gcashname=YourGCashName",
          list: "/spin?action=list",
          list_admin: "/spin?action=list&apikey=",
          spin: "/spin?action=spin&apikey= (spin one by one)",
          winners: "/spin?action=winners",
          winners_admin: "/spin?action=winners&apikey=",
          reset: "/spin?action=reset&reset=true&apikey="
        },
        current_participants: loadEntries().length,
        current_winners: loadSpinHistory().winners.length,
        total_winners: TOTAL_WINNERS,
        prize_per_winner: `₱${PRIZE_PER_WINNER}`,
        total_prize: `₱${TOTAL_PRIZE}`,
        note: "Spin 4 times to select 4 different winners! Each spin requires API key."
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
