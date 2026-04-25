// commands/matangazo.js
const supabase = require("../lib/supabase");

async function matangazo(sock, msg, from) {
  try {
    await sock.sendMessage(from, { react: { text: "📢", key: msg.key } });
    await sock.sendMessage(from, { text: "⏳ Inatafuta matangazo..." }, { quoted: msg });

    const { data, error } = await supabase
      .from("announcements")
      .select("id, short_id, title, image_url, date")
      .order("date", { ascending: false });

    if (error) throw new Error(error.message);

    if (!data || data.length === 0) {
      return await sock.sendMessage(from, {
        text: "📭 Hakuna matangazo kwa sasa."
      }, { quoted: msg });
    }

    await sock.sendMessage(from, {
      text:
        `📢 *MATANGAZO*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 Jumla: ${data.length}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━`
    }, { quoted: msg });

    for (const item of data) {
      const caption =
        `📢 *${item.title}*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📅 Tarehe: ${item.date}\n` +
        `🔑 ID: *${item.short_id}*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `✍️ _Published by This is Bucca_`;

      await sock.sendMessage(from, {
        image:   { url: item.image_url },
        caption: caption,
      });

      await new Promise(r => setTimeout(r, 1500));
    }

    await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

  } catch (err) {
    console.error("❌ Hitilafu ya matangazo:", err.message);
    await sock.sendMessage(from, {
      text: `❌ *Imeshindwa kupata matangazo*\n${err.message}`
    }, { quoted: msg });
  }
}

module.exports = matangazo;