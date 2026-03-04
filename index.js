require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  ChannelType,
  PermissionFlagsBits
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

const PRICE_RATE = 5000;
let legitVotes = { yes: 0, no: 0 };
let legitMessageId = null;

// ================= READY =================
client.once("ready", async () => {
  console.log(`✅ Bot online: ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("opinia")
      .setDescription("Wystaw opinię o sklepie")
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
});

// ================= KOMENDY =================
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args.shift()?.toLowerCase();

  // ================= KALKULATOR =================
  if (cmd === "!kalkulator") {

    const embed = new EmbedBuilder()
      .setTitle("💰 Kalkulator Waluty")
      .setDescription(
        "Oblicz ile otrzymasz waluty.\n\n" +
        "💵 **1 zł = 5000$**\n\n" +
        "Kliknij przycisk i wpisz kwotę."
      )
      .setColor("#00ff99")
      .setThumbnail(message.guild.iconURL())
      .setImage("https://i.imgur.com/8KQZQ6M.png")
      .setTimestamp()
      .setFooter({ text: "VoidMint • System Automatyczny" });

    const row = new ActionRowBuilder().addComponents({
      type: 2,
      style: 3,
      label: "Oblicz teraz",
      custom_id: "open_calc"
    });

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // ================= REGULAMIN =================
  if (cmd === "!regulamin") {

    const embed = new EmbedBuilder()
      .setTitle("📜 Regulamin Sklepu")
      .setColor("#ff3b3b")
      .setDescription(`
🔐 Zakup = akceptacja zasad  
💸 Brak zwrotów po realizacji  
⏳ Realizacja do 24h  
📌 Reklamacje tylko z dowodem  
🚫 Zakaz scamowania / oszustw  
❌ Nie odpowiadamy za błędne dane
`)
      .setThumbnail(message.guild.iconURL())
      .setTimestamp()
      .setFooter({ text: "VoidMint • Regulamin" });

    return message.channel.send({ embeds: [embed] });
  }

  // ================= CENNIK =================
  if (cmd === "!cennik") {

    const embed = new EmbedBuilder()
      .setTitle("💎 Cennik Produktów")
      .setColor("#5865F2")
      .setDescription(`
💵 5000$ — **1 zł**
🍎 64 jabłka — **1 zł**
🔥 16 koksów — **5 zł**
⚔ Miecz — **5 zł**
⛏ Kilof — **5 zł**
🛡 Zbroja — **10 zł**
👑 Zbroja 2 — **30 zł**
`)
      .setThumbnail("https://cdn-icons-png.flaticon.com/512/1828/1828884.png")
      .setTimestamp()
      .setFooter({ text: "VoidMint • Aktualne ceny" });

    return message.channel.send({ embeds: [embed] });
  }

  // ================= ZAPROSZENIA =================
  if (cmd === "!zaproszenia") {

    const embed = new EmbedBuilder()
      .setTitle("🎁 Nagrody za Zaproszenia")
      .setColor("#ff9900")
      .setDescription(`
🔹 2 = 1000$  
🔹 4 = 2500$  
🔹 7 = Ana Set  
🔹 10 = 20 000$  
🔹 30 = Elytra
`)
      .setTimestamp()
      .setFooter({ text: "Nagrody przyznawane ręcznie" });

    return message.channel.send({ embeds: [embed] });
  }

  // ================= TICKET =================
  if (cmd === "!ticket") {

    const embed = new EmbedBuilder()
      .setTitle("🎫 System Ticketów")
      .setColor("#8e44ad")
      .setDescription(
        "Kliknij menu poniżej aby stworzyć ticket.\n\n" +
        "📦 Zakup\n❗ Problem\n💬 Inne"
      )
      .setThumbnail(message.guild.iconURL())
      .setTimestamp()
      .setFooter({ text: "VoidMint Support" });

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("ticket_select")
        .setPlaceholder("Wybierz kategorię")
        .addOptions([
          { label: "Zakup", value: "zakup" },
          { label: "Problem", value: "problem" },
          { label: "Inne", value: "inne" }
        ])
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // ================= LEGIT (REAKCJE) =================
  if (cmd === "!czylegit") {

    const embed = new EmbedBuilder()
      .setTitle("🔥 Czy VoidMint Jest Legit?")
      .setColor("#00ff99")
      .setDescription(
        "Zareaguj poniżej:\n\n" +
        "✅ Legit\n" +
        "❌ Nie Legit\n\n" +
        `Aktualne głosy:\n✅ ${legitVotes.yes}\n❌ ${legitVotes.no}`
      )
      .setThumbnail(message.guild.iconURL())
      .setTimestamp()
      .setFooter({ text: "Głosowanie publiczne" });

    const msg = await message.channel.send({ embeds: [embed] });

    legitMessageId = msg.id;

    await msg.react("✅");
    await msg.react("❌");
  }
});

// ================= REAKCJE =================
client.on("messageReactionAdd", async (reaction, user) => {

  if (user.bot) return;
  if (reaction.message.id !== legitMessageId) return;

  if (reaction.emoji.name === "✅") legitVotes.yes++;
  if (reaction.emoji.name === "❌") legitVotes.no++;

  await reaction.message.edit({
    embeds: [
      new EmbedBuilder()
        .setTitle("🔥 Czy VoidMint Jest Legit?")
        .setColor("#00ff99")
        .setDescription(
          "Zareaguj poniżej:\n\n" +
          `✅ ${legitVotes.yes}\n❌ ${legitVotes.no}`
        )
        .setTimestamp()
        .setFooter({ text: "Aktualizowane na żywo" })
    ]
  });
});

// ================= INTERAKCJE =================
client.on("interactionCreate", async interaction => {

  // ===== KALKULATOR MODAL =====
  if (interaction.isButton() && interaction.customId === "open_calc") {

    const modal = new ModalBuilder()
      .setCustomId("calc_modal")
      .setTitle("Kalkulator Waluty");

    const input = new TextInputBuilder()
      .setCustomId("amount")
      .setLabel("Ile zł wpłacasz?")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(input)
    );

    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === "calc_modal") {

    const amount = Number(interaction.fields.getTextInputValue("amount"));
    const result = amount * PRICE_RATE;

    return interaction.reply({
      content: `💰 Otrzymasz **${result}$**`,
      ephemeral: true
    });
  }

  // ===== TICKET TWORZENIE =====
  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_select") {

    const category = interaction.values[0];

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel] },
        { id: process.env.OWNER_ID, allow: [PermissionFlagsBits.ViewChannel] },
        { id: process.env.CREATOR_ID, allow: [PermissionFlagsBits.ViewChannel] }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle("🎫 Nowy Ticket")
      .setColor("#ff9900")
      .setDescription("Support odpowie jak najszybciej.")
      .addFields(
        { name: "Utworzył", value: interaction.user.tag, inline: true },
        { name: "Kategoria", value: category, inline: true }
      )
      .setTimestamp();

    await channel.send({ content: "@everyone", embeds: [embed] });

    return interaction.reply({
      content: `✅ Ticket utworzony: ${channel}`,
      ephemeral: true
    });
  }

  // ===== /OPINIA =====
  if (interaction.isChatInputCommand() && interaction.commandName === "opinia") {

    const modal = new ModalBuilder()
      .setCustomId("opinia_modal")
      .setTitle("⭐ Wystaw opinię");

    const text = new TextInputBuilder()
      .setCustomId("tekst")
      .setLabel("Twoja opinia")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const obs = new TextInputBuilder()
      .setCustomId("obs")
      .setLabel("Obsługa (1-5)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const czas = new TextInputBuilder()
      .setCustomId("czas")
      .setLabel("Czas (1-5)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(text),
      new ActionRowBuilder().addComponents(obs),
      new ActionRowBuilder().addComponents(czas)
    );

    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === "opinia_modal") {

    const tekst = interaction.fields.getTextInputValue("tekst");
    const obs = interaction.fields.getTextInputValue("obs");
    const czas = interaction.fields.getTextInputValue("czas");

    const embed = new EmbedBuilder()
      .setTitle("⭐ Nowa Opinia")
      .setColor("#ffd700")
      .setDescription(tekst)
      .addFields(
        { name: "Obsługa", value: `${obs}/5 ⭐`, inline: true },
        { name: "Czas", value: `${czas}/5 ⭐`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: "Opinia klienta" });

    return interaction.reply({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
