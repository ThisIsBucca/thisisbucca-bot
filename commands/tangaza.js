// commands/tangaza.js
const supabase = require("../lib/supabase");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

async function tangaza(sock, msg, from, text, args) {
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

    // Angalia kama ni reply kwenye image
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg   = contextInfo?.quotedMessage;
    const imageMsg    = quotedMsg?.imageMessage;

    if (!imageMsg) {
      return await sock.sendMessage(from, {
        text:
          `❌ *Hakuna picha iliyoreplyiwa!*\n\n` +
          `📌 Jinsi ya kutumia:\n` +
          `1. Tuma picha kwenye chat\n` +
          `2. Reply kwenye picha hiyo na:\n` +
          `   *.tangaza Kichwa cha Tangazo | 2026-04-25*`
      }, { quoted: msg });
    }

    // Validate args
    const fullText = args.join(" ");
    const parts    = fullText.split("|").map(p => p.trim());

    if (parts.length < 2) {
      return await sock.sendMessage(from, {
        text:
          `❌ *Format si sahihi!*\n\n` +
          `📌 Tumia:\n` +
          `*.tangaza Kichwa | YYYY-MM-DD*\n\n` +
          `_Mfano: .tangaza Safari Imefutwa | 2026-04-25_`
      }, { quoted: msg });
    }

    const title = parts[0];
    const date  = parts[1];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return await sock.sendMessage(from, {
        text: "❌ Tarehe si sahihi. Format: YYYY-MM-DD"
      }, { quoted: msg });
    }

    if (!title || title.length < 3) {
      return await sock.sendMessage(from, {
        text: "❌ Kichwa ni kifupi sana."
      }, { quoted: msg });
    }

    await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });
    await sock.sendMessage(from, { text: "📥 Inapakua picha..." }, { quoted: msg });

    // Download image kutoka WhatsApp (decrypt automatically)
    const quotedMsgFull = {
      key: {
        remoteJid: from,
        id:        contextInfo.stanzaId,
        fromMe:    false,
      },
      message: quotedMsg,
    };

    const imageBuffer = await downloadMediaMessage(
      quotedMsgFull,
      "buffer",
      {},
      { logger: console, reuploadRequest: sock.updateMediaMessage }
    );

    // Upload kwenye Supabase Storage
    await sock.sendMessage(from, { text: "☁️ Inapakia picha kwenye server..." }, { quoted: msg });

    const fileName  = `tangazo_${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("announcements")
      .upload(fileName, imageBuffer, {
        contentType: "image/jpeg",
        upsert:      false,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    // Pata public URL
    const { data: urlData } = supabase
      .storage
      .from("announcements")
      .getPublicUrl(fileName);

    const image_url = urlData.publicUrl;

    // POST kwenda Supabase table
    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title:     title,
        image_url: image_url,
        date:      date,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });
    await sock.sendMessage(from, {
      text:
        `✅ *Tangazo Limeongezwa!*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📢 Kichwa:  ${data.title}\n` +
        `📅 Tarehe: ${data.date}\n` +
        `🖼️  Picha:   ${image_url}\n` +
        `🔑 ID:      ${data.id}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━`
    }, { quoted: msg });

  } catch (err) {
    console.error("❌ Hitilafu ya tangaza:", err.message);
    await sock.sendMessage(from, {
      text: `❌ *Hitilafu:* ${err.message}`
    }, { quoted: msg });
  }
}

module.exports = tangaza;