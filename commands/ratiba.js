// commands/ratiba.js
// 🚢 Ratiba Kamili ya Feri — Mafia Ferry

const supabase = require("../lib/supabase");
const { format, parseISO } = require("date-fns");

// --- Tafsiri za Kiswahili ---
const dayMap = {
    Monday:    "Jumatatu",
    Tuesday:   "Jumanne",
    Wednesday: "Jumatano",
    Thursday:  "Alhamisi",
    Friday:    "Ijumaa",
    Saturday:  "Jumamosi",
    Sunday:    "Jumapili",
};

const swahiliMonths = {
    January:   "Januari",  February: "Februari", March:     "Machi",
    April:     "Aprili",   May:      "Mei",       June:      "Juni",
    July:      "Julai",    August:   "Agosti",    September: "Septemba",
    October:   "Oktoba",   November: "Novemba",   December:  "Desemba",
};

// --- Helpers ---

/**
 * Inazuia tatizo la Timezone kwa kutumia parseISO
 */
function formatSwahiliDate(dateStr) {
    if (!dateStr) return "N/A";
    const date  = parseISO(dateStr); // Muhimu: Inasoma YYYY-MM-DD bila kupoteza saa
    const dayEn = format(date, "EEEE");
    const month = format(date, "MMMM");
    
    const daySw   = dayMap[dayEn] || dayEn;
    const monthSw = swahiliMonths[month] || month;
    
    return `${daySw}, ${format(date, "d")} ${monthSw} ${format(date, "yyyy")}`;
}

function getTimeOfDay(timeStr) {
    if (!timeStr) return "";
    const hour = parseInt(timeStr.split(":")[0], 10);
    if (hour >= 5  && hour < 12) return "🌅 Asubuhi";
    if (hour >= 12 && hour < 14) return "☀️ Adhuhuri";
    if (hour >= 14 && hour < 16) return "🌤️ Mchana";
    if (hour >= 16 && hour < 19) return "🌇 Jioni";
    if (hour >= 19 && hour < 23) return "🌆 Usiku";
    return "🌙 Usiku wa Manane";
}

function formatTime12hr(timeStr) {
    if (!timeStr) return "N/A";
    const [hourStr, minute] = timeStr.split(":");
    const hour   = parseInt(hourStr, 10);
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    const ampm   = hour >= 12 ? "Mchana/Jioni" : "Asubuhi";

    return `${hour12}:${minute}`;
}

function getStatus(dateStr) {
    const today = new Date().toISOString().split("T")[0];
    if (dateStr === today) return "🟢 LEO";
    if (dateStr > today)   return "🔵 Inakuja";
    return "⚫ Imepita";
}

// --- Format Schedule ---
function formatSchedule(items) {
    if (!items || items.length === 0) return "📭 Hakuna ratiba iliyopatikana kwenye database.";

    const today         = new Date().toISOString().split("T")[0];
    const todayCount    = items.filter(i => i.date === today).length;
    const upcomingCount = items.filter(i => i.date > today).length;
    const passedCount   = items.filter(i => i.date < today).length;

    const lines = items.map((item) => {
        const ship      = item.ship_name || "Chombo";
        const route     = item.route     || "Route haijulikani";
        const depart    = formatTime12hr(item.departure);
        const date      = formatSwahiliDate(item.date);
        const timeOfDay = getTimeOfDay(item.departure);
        const status    = getStatus(item.date);
        
        // Optional Fields
        const notes    = item.notes ? `│ 📝 Maelezo: ${item.notes}\n` : "";
        const duration = item.duration ? `│ ⏱️ Safari: ${item.duration}\n` : "";

        return (
            `┌─────────────────────────────\n` +
            `│ ${status}\n` +
            `│ 🚢 *${ship.toUpperCase()}*\n` +
            `│ 🛤️ Njia: ${route}\n` +
            `│ 📅 Tarehe: ${date}\n` +
            `│ 🕐 Muda: ${depart} (${timeOfDay})\n` +
            duration +
            notes +
            `└─────────────────────────────`
        );
    });

    const now       = new Date();
    const timestamp = `${format(now, "d")} ${swahiliMonths[format(now, "MMMM")]} ${format(now, "yyyy")} 🕐 ${format(now, "HH:mm")}`;

    const header = 
        `🚢 *RATIBA YA FERI MAFIA*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🟢 Leo: ${todayCount} | 🔵 Zinakuja: ${upcomingCount}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    const footer =
    `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🕒 *Ilisasishwa:* ${timestamp}\n\n` +
    `🌐 *Ratiba za Live:*\n` +
    `https://mafiaferry.vercel.app/\n\n` +
    `💬 *Jiunge na Group letu:*\n` +
    `https://chat.whatsapp.com/DpEfq8kAhFlCNJDMZht8c2\n\n` +
    `⚠️ _Ratiba zinaweza kubadilika bila notisi_\n\n` +
    `✍️ _Published by This is Bucca_\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    return header + lines.join("\n\n") + footer;
}

// --- Command Handler ---
async function ratiba(sock, msg, from) {
    try {
        await sock.sendMessage(from, { react: { text: "🚢", key: msg.key } });

        // Tunachuja tu ratiba za LEO na za MBELENI (Zilizopita hazionekani kero)
        const today = new Date().toISOString().split("T")[0];

        const { data, error } = await supabase
            .from("schedules")
            .select("*")
            .gte("date", today) // Inaleta ratiba za leo na zinazokuja tu
            .order("date", { ascending: true })
            .order("departure", { ascending: true });

        if (error) throw error;

        const formatted = formatSchedule(data);
        await sock.sendMessage(from, { text: formatted }, { quoted: msg });
        await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

    } catch (err) {
        console.error("❌ Hitilafu:", err.message);
        await sock.sendMessage(from, { text: `❌ *Error:* ${err.message}` }, { quoted: msg });
    }
}

module.exports = ratiba;