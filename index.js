const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  Partials
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const token = "TWÓJ_TOKEN_TUTAJ";
const prefix = "!";
let legitMessageId = null;
let legitVotes = { yes: 0, no: 0 };

client.once("ready", () => {
  console.log(`✅ Bot online jako ${client.user.tag}`);
});

//
// ================= PANEL TICKET =================
//

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!panel") {

    const embed = new EmbedBuilder()
      .setTitle("🎫 PANEL TICKETÓW")
      .setDescription("Wybierz kategorię aby stworzyć ticket.")
      .setColor("#2b2d31")
      .setTimestamp();

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_select")
      .setPlaceholder("Wybierz kategorię")
      .addOptions([
        { label: "Zakup", value: "zakup" },
        { label: "Pomoc", value: "pomoc" },
        { label: "Inne", value: "inne" }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    message.channel.send({ embeds: [embed], components: [row] });
  }
});

//
// ================= TICKET TWORZENIE =================
//

client.on("interactionCreate", async (interaction) => {

  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_select") {

    const category = interaction.values[0];

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle("🎫 Nowy Ticket")
      .setDescription(
        `👤 Autor: <@${interaction.user.id}>\n📂 Kategoria: **${category}**`
      )
      .setColor("#00ff99")
      .setTimestamp();

    const closeButton = new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("Zamknij Ticket")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🔒");

    const row = new ActionRowBuilder().addComponents(closeButton);

    await channel.send({
      content: "@everyone",
      embeds: [embed],
      components: [row]
    });

    return interaction.reply({
      content: `✅ Ticket utworzony: ${channel}`,
      ephemeral: true
    });
  }

  if (interaction.isButton() && interaction.customId === "close_ticket") {

    await interaction.reply({
      content: "🔒 Zamykam ticket za 5 sekund...",
      ephemeral: true
    });

    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 5000);
  }
});

//
// ================= LEGIT (REAKCJE) =================
//

client.on("messageCreate", async (message) => {

  if (message.content !== "!czylegit") return;

  legitVotes = { yes: 0, no: 0 };

  const embed = new EmbedBuilder()
    .setTitle("🔥 Czy jesteśmy legit?")
    .setDescription("Zareaguj poniżej:\n\n✅ — Tak\n❌ — Nie")
    .setColor("#00ff99")
    .setTimestamp();

  const msg = await message.channel.send({ embeds: [embed] });

  legitMessageId = msg.id;

  await msg.react("✅");
  await msg.react("❌");
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  if (!legitMessageId) return;
  if (reaction.message.id !== legitMessageId) return;

  if (reaction.emoji.name === "✅") legitVotes.yes++;
  if (reaction.emoji.name === "❌") legitVotes.no++;

  await reaction.message.edit({
    embeds: [
      new EmbedBuilder()
        .setTitle("🔥 Czy jesteśmy legit?")
        .setDescription(
          `✅ Tak: ${legitVotes.yes}\n❌ Nie: ${legitVotes.no}`
        )
        .setColor("#00ff99")
        .setTimestamp()
    ]
  });
});

//
// ================= KOMENDY =================
//

client.on("messageCreate", (message) => {
  if (!message.content.startsWith(prefix)) return;
  if (message.author.bot) return;

  const cmd = message.content.slice(1).toLowerCase();

  if (cmd === "kalkulator") {

    const embed = new EmbedBuilder()
      .setTitle("🧮 Kalkulator")
      .setDescription("Użyj: `!kalkulator 10*5000`")
      .setColor("#0099ff");

    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "zapro") {

    const embed = new EmbedBuilder()
      .setTitle("🎁 Nagrody za zaproszenia")
      .setDescription(
        "5 zaproszeń — Ana miecz\n" +
        "10 zaproszeń — Ana set\n" +
        "20 zaproszeń — Ana set 2"
      )
      .setColor("#ffd700");

    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "itemy") {

    const embed = new EmbedBuilder()
      .setTitle("🛒 Itemy")
      .setDescription(
        "⚔ Ana miecz — 5 zł\n" +
        "⛏ Ana kilof — 5 zł\n" +
        "🛡 Ana set — 10 zł\n" +
        "💎 Ana set 2 — 30 zł\n" +
        "🪽 Elytra — 40 zł"
      )
      .setColor("#8a2be2");

    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "cennik") {

    const embed = new EmbedBuilder()
      .setTitle("💎 Cennik")
      .setDescription(
        "Ana miecz — 5 zł\n" +
        "Ana kilof — 5 zł\n" +
        "Ana set — 10 zł\n" +
        "Ana set 2 — 30 zł\n" +
        "Elytra — 40 zł"
      )
      .setColor("#ff4d6d");

    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "metody") {

    const embed = new EmbedBuilder()
      .setTitle("💳 Metody Płatności")
      .setDescription(
        "🟡 LTC\n" +
        "🟠 BTC\n" +
        "🟢 PSC\n" +
        "🔵 BLIK"
      )
      .setColor("#00ffff");

    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "czylegit") {

    const embed = new EmbedBuilder()
      .setTitle("✅ Czy sklep jest legit?")
      .setDescription("Zareaguj:\n\n✅ Tak\n❌ Nie")
      .setColor("#00ff00")
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
});

client.login(token);
