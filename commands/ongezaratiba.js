const supabase = require("../lib/supabase");

const OWNER_NUMBER = "255776986840";
const VALID_SHIPS = ["MV Kilindoni", "MV Songosongo", "MV Bucca,mashua", "MV Amana,tukutuku", "MV bwejuu"];

async function ongezaratiba(sock, msg, from, text) {
    try {
        // 1. Auth Check
        const senderRaw = msg.key.participant || from; 
        const senderNumber = senderRaw.split("@")[0].replace(/\D/g, "");

        if (OWNER_NUMBER !== OWNER_NUMBER) {
            return await sock.sendMessage(from, { text: "🚫 Access Denied." }, { quoted: msg });
        }

        // 2. Parse Input
        const rawBody = text.replace(/^\.ongezaratiba\s+/i, "").trim();
        if (!rawBody || rawBody.toLowerCase() === ".ongezaratiba") {
            return await sock.sendMessage(from, { text: "💡 Format: \`.ongezaratiba Ship | Route | Day | Date | Dep | Arr | Dur | Notes\`" }, { quoted: msg });
        }

        const args = rawBody.split("|").map(item => item.trim());
        if (args.length < 7) {
            return await sock.sendMessage(from, { text: "⚠️ Fill all 7 fields." }, { quoted: msg });
        }

        // 3. Construct Object
        const scheduleObject = {
            ship_name: args[0],
            route:     args[1],
            days:      args[2],
            date:      args[3],
            departure: args[4],
            arrival:   args[5],
            duration:  args[6],
            notes:     args[7] || ""
        };

        // 4. Validation
        if (!VALID_SHIPS.includes(scheduleObject.ship_name)) {
            return await sock.sendMessage(from, { text: `❌ Ship "${scheduleObject.ship_name}" not found.` }, { quoted: msg });
        }

        // 5. Database Interaction
        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

        const { data, error } = await supabase
            .from("schedules")
            .insert([scheduleObject])
            .select();

        if (error) {
            // Check specifically for RLS errors
            if (error.code === '42501') {
                throw new Error("RLS Policy Violation: Enable 'Insert' policy in Supabase Dashboard.");
            }
            throw error;
        }

        // 6. Success
        await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });
        await sock.sendMessage(from, {
            text: `✅ *SAVED TO DATABASE*\n\n🚢 ${scheduleObject.ship_name}\n📅 ${scheduleObject.date}\n\nCheck Web: https://mafiaferry.vercel.app/`
        }, { quoted: msg });

    } catch (err) {
        console.error("❌ RLS or DB Error:", err.message);
        await sock.sendMessage(from, { 
            text: `🚨 *Database Error:* ${err.message}\n\n_Tip: Check if RLS is enabled on your table!_` 
        }, { quoted: msg });
    }
}

module.exports = ongezaratiba;