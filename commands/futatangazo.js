// commands/futatangazo.js
const supabase = require("../lib/supabase");

async function futatangazo(sock, msg, from, text, args) {
  try {
    const ownerNumber  = (process.env.OWNER_NUMBER || "").replace(/[^0-9]/g, "");
    const senderNumber = from.split("@")[0].replace(/[^0-9]/g, "");

    if (ownerNumber !== ownerNumber) {
      return await sock.sendMessage(
        from,
        { text: "❌ Samahani, command hii ni kwa owner tu." },
        { quoted: msg }
      );
    }

    const shortId = args[0]?.toUpperCase();
    if (!shortId) {
      return await sock.sendMessage(from, {
        text:
          `❌ *Hakuna ID iliyopewa!*\n\n` +
          `📌 Jinsi ya kutumia:\n` +
          `*.futatangazo XXXX*\n\n` +
          `_Mfano: .futatangazo A1B2_\n\n` +
          `_Pata ID kwa kutuma .matangazo_`
      }, { quoted: msg });
    }

    await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

    // Tafuta kwa short_id
    const { data: found, error: findError } = await supabase
      .from("announcements")
      .select("*")
      .eq("short_id", shortId)
      .single();

    if (findError || !found) {
      return await sock.sendMessage(from, {
        text: `❌ Tangazo *${shortId}* halijapatikana.`
      }, { quoted: msg });
    }

    // Futa image kutoka Storage
    const fileName = found.image_url.split("/").pop();
    await supabase.storage.from("announcements").remove([fileName]);

    // Futa kutoka table
    const { error: deleteError } = await supabase
      .from("announcements")
      .delete()
      .eq("short_id", shortId);

    if (deleteError) throw new Error(deleteError.message);

    await sock.sendMessage(from, { react: { text: "🗑️", key: msg.key } });
    await sock.sendMessage(from, {
      text:
        `🗑️ *Tangazo Limefutwa!*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📢 Kichwa:  ${found.title}\n` +
        `📅 Tarehe: ${found.date}\n` +
        `🔑 ID:      ${found.short_id}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━`
    }, { quoted: msg });

  } catch (err) {
    console.error("❌ Hitilafu ya futatangazo:", err.message);
    await sock.sendMessage(from, {
      text: `❌ *Imeshindwa kufuta tangazo*\n${err.message}`
    }, { quoted: msg });
  }
}

module.exports = futatangazo;