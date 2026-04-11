// api/spin.js

const fs = require('fs');
const path = require('path');

// Storage files
const RAFFLE_FILE = path.join(__dirname, '../data/raffle_entries.json');
const SPIN_HISTORY_FILE = path.join(__dirname, '../data/spin_history.json');
const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
      const { action, name, gcashnumber, gcashname, reset } = req.query;
      
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
            gcash_number: newEntry.gcashnumber,
            gcash_name: newEntry.gcashname,
            entry_number: entries.length
          },
          total_participants: entries.length
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
        
        return res.json({
          status: true,
          total_participants: entries.length,
          participants: entries.map((entry, index) => ({
            number: index + 1,
            name: entry.name,
            gcash_number: entry.gcashnumber,
            gcash_name: entry.gcashname,
            joined_at: entry.timestamp
          }))
        });
      }
      
      // Handle reset (clear all participants)
      if (action === 'reset' && reset === 'true') {
        saveEntries([]);
        
        return res.json({
          status: true,
          message: "Raffle has been reset. All participants cleared."
        });
      }
      
      // Handle spin - pick ONE random winner
      if (action === 'spin') {
        const entries = loadEntries();
        
        if (entries.length === 0) {
          return res.status(400).json({
            status: false,
            error: "No participants found. Please ask people to join first.",
            instruction: "Use: /spin?action=join&name=YourName&gcashnumber=09916527333&gcashname=YourGCashName"
          });
        }
        
        // Check if spin already done
        const spinHistory = loadSpinHistory();
        if (spinHistory.last_winner && spinHistory.last_winner.date === new Date().toISOString().split('T')[0]) {
          return res.json({
            status: false,
            error: "Spin already done today!",
            message: "The winner has already been selected for today.",
            winner: spinHistory.last_winner
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
            prize: "₱50 GCash",
            amount: 50,
            date: spinResult.timestamp,
            entry_number: winnerNumber
          });
        } else {
          spinHistory.winners = [{
            name: winner.name,
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
      
      // Handle winner check
      if (action === 'winner') {
        const spinHistory = loadSpinHistory();
        
        if (!spinHistory.last_winner) {
          return res.json({
            status: true,
            message: "No spin has been done yet. Use /spin?action=spin to pick a winner!"
          });
        }
        
        return res.json({
          status: true,
          winner: spinHistory.last_winner.winner,
          winner_number: spinHistory.last_winner.winner_number,
          prize: "₱50 GCash",
          date: spinHistory.last_winner.date,
          total_participants: spinHistory.last_winner.total_participants
        });
      }
      
      // Default response - show available actions
      res.json({
        status: true,
        message: "🎰 RAFFLE SPIN SYSTEM 🎰",
        available_actions: {
          join: "/spin?action=join&name=YourName&gcashnumber=09916527333&gcashname=YourGCashName",
          list: "/spin?action=list",
          spin: "/spin?action=spin",
          winner: "/spin?action=winner",
          reset: "/spin?action=reset&reset=true"
        },
        current_participants: loadEntries().length
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
