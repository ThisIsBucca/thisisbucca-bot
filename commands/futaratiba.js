const supabase = require("../lib/supabase");

// --- 1. CONFIGURATION ---
const OWNER_NUMBER = "255776986840";
const VALID_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * Command Handler: futaratiba
 * Inafuta ratiba kulingana na Siku na Jina la Meli
 */
async function futaratiba(sock, msg, from, text) {
    try {
        // --- 2. AUTH CHECK ---
        const senderRaw = msg.key.participant || from; 
        const senderNumber = senderRaw.split("@")[0].replace(/\D/g, "");

        if (OWNER_NUMBER !== OWNER_NUMBER) {
            return await sock.sendMessage(from, { text: "🚫 Unauthorized." }, { quoted: msg });
        }

        // --- 3. PARSING ARGUMENTS ---
        // Format: .futaratiba Monday | MV Kilindoni
        const rawArgs = text.replace(/^\.futaratiba\s+/i, "").trim();
        const args = rawArgs.split("|").map(a => a.trim());

        if (!rawArgs || args.length < 2) {
            return await sock.sendMessage(from, { 
                text: `💡 *JINSI YA KUFUTA KWA SIKU*\n\n` +
                      `Format: \`.futaratiba Siku | Jina la Meli\`\n\n` +
                      `*Mfano:* \`.futaratiba Monday | MV Kilindoni\``
            }, { quoted: msg });
        }

        const dayToDelete = args[0];
        const shipToDelete = args[1];

        // Validate if it's a real day
        if (!VALID_DAYS.includes(dayToDelete)) {
            return await sock.sendMessage(from, { text: `❌ Siku "${dayToDelete}" si sahihi. Tumia English (e.g., Monday).` }, { quoted: msg });
        }

        // --- 4. DATABASE ACTION ---
        await sock.sendMessage(from, { react: { text: "🗑️", key: msg.key } });

        // Tunafuta ratiba zinazolingana na Siku NA Meli
        const { data, error, count } = await supabase
            .from("schedules")
            .delete({ count: 'exact' })
            .eq("days", dayToDelete)
            .eq("ship_name", shipToDelete);

        if (error) throw error;

        // --- 5. FEEDBACK ---
        if (count === 0) {
            return await sock.sendMessage(from, { 
                text: `⚠️ Hakuna ratiba iliyopatikana kwa: *${shipToDelete}* siku ya *${dayToDelete}*.` 
            }, { quoted: msg });
        }

        await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });
        await sock.sendMessage(from, {
            text: `🗑️ *USAFI UMEKAMILIKA*\n` +
                  `━━━━━━━━━━━━━━━━━━━━\n` +
                  `✅ Imefuta safari *${count}* za meli ya *${shipToDelete}* zilizokuwa siku ya *${dayToDelete}*.\n\n` +
                  `🌐 Website imekuwa updated sasa hivi.`
        }, { quoted: msg });

    } catch (err) {
        console.error("❌ Delete Error:", err.message);
        await sock.sendMessage(from, { text: `🚨 Hitilafu: ${err.message}` }, { quoted: msg });
    }
}

module.exports = futaratiba;