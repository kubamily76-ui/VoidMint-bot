require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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
    GatewayIntentBits.MessageContent
  ]
});

const PRICE_RATE = 5000;
let legitVotes = { yes: 0, no: 0 };

// ================= READY =================
client.once("ready", async () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);

  // Rejestracja slash komend
  const commands = [
    new SlashCommandBuilder()
      .setName("opinia")
      .setDescription("Wystaw opinię o sklepie")
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );
});

// ================= PREFIX KOMENDY =================
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args.shift()?.toLowerCase();

  // ===== !kalkulator =====
  if (cmd === "!kalkulator") {
    const embed = new EmbedBuilder()
      .setTitle("💰 Kalkulator VoidMint")
      .setDescription("**1 zł = 5000$**\nKliknij przycisk i wpisz kwotę.")
      .setColor("#00ff88");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_calc")
        .setLabel("Oblicz")
        .setStyle(ButtonStyle.Success)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // ===== !regulamin =====
  if (cmd === "!regulamin") {
    const embed = new EmbedBuilder()
      .setTitle("📜 Regulamin VoidMint")
      .setColor("#00ff88")
      .setDescription(`
1️⃣ Płatność = akceptacja regulaminu  
2️⃣ Brak zwrotów po realizacji  
3️⃣ Reklamacje tylko z dowodem  
4️⃣ Czas realizacji do 24h  
5️⃣ Zakaz scamowania i spamu  
6️⃣ Nie odpowiadamy za błędny nick
`);

    return message.channel.send({ embeds: [embed] });
  }

  // ===== !cennik =====
  if (cmd === "!cennik") {
    const embed = new EmbedBuilder()
      .setTitle("💎 Cennik")
      .setColor("Green")
      .setDescription(`
💵 5000$ — 1 zł  
🍎 64 złote jabłka — 1 zł  
🔥 16 koksów — 5 zł  
⚔ Ana miecz — 5 zł  
⛏ Ana kilof — 5 zł  
🛡 Ana zbroja — 10 zł  
👑 Ana zbroja 2 — 30 zł
`);

    return message.channel.send({ embeds: [embed] });
  }

  // ===== !zaproszenia =====
  if (cmd === "!zaproszenia") {
    const embed = new EmbedBuilder()
      .setTitle("🎁 Nagrody za zaproszenia")
      .setColor("Blue")
      .setDescription(`
2 zaproszenia = 1000$  
4 zaproszenia = 2500$  
7 zaproszeń = Ana set  
10 zaproszeń = 20 000$  
30 zaproszeń = Elytra
`);

    return message.channel.send({ embeds: [embed] });
  }

  // ===== !ticket =====
  if (cmd === "!ticket") {
    const embed = new EmbedBuilder()
      .setTitle("🎫 System Ticketów")
      .setDescription("Wybierz kategorię aby utworzyć ticket.")
      .setColor("Purple");

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

  // ===== !czylegit =====
  if (cmd === "!czylegit") {
    const embed = new EmbedBuilder()
      .setTitle("🔎 Czy VoidMint jest legit?")
      .setColor("#00ff88")
      .setDescription(`
Jeśli wszystko było ok → ✅  
Jeśli masz zastrzeżenia → ❌  

Aktualne głosy:
✅ ${legitVotes.yes}
❌ ${legitVotes.no}
`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("legit_yes")
        .setLabel("LEGIT")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("legit_no")
        .setLabel("NIE LEGIT")
        .setStyle(ButtonStyle.Danger)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }
});

// ================= INTERAKCJE =================
client.on("interactionCreate", async interaction => {

  // ===== KALKULATOR MODAL =====
  if (interaction.isButton() && interaction.customId === "open_calc") {
    const modal = new ModalBuilder()
      .setCustomId("calc_modal")
      .setTitle("Oblicz walutę");

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
      content: `💰 Za ${amount} zł otrzymasz **${result}$**`,
      ephemeral: true
    });
  }

  // ===== TICKETY =====
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
      .setColor("Orange")
      .addFields(
        { name: "Utworzył", value: interaction.user.tag },
        { name: "Kategoria", value: category }
      );

    await channel.send({ content: "@everyone", embeds: [embed] });

    return interaction.reply({
      content: `✅ Ticket utworzony: ${channel}`,
      ephemeral: true
    });
  }

  // ===== LEGIT GŁOSY =====
  if (interaction.isButton()) {
    if (interaction.customId === "legit_yes") legitVotes.yes++;
    if (interaction.customId === "legit_no") legitVotes.no++;

    return interaction.reply({
      content: "✅ Głos zapisany",
      ephemeral: true
    });
  }

  // ===== /opinia =====
  if (interaction.isChatInputCommand() && interaction.commandName === "opinia") {

    const modal = new ModalBuilder()
      .setCustomId("opinia_modal")
      .setTitle("Wystaw opinię");

    const tekst = new TextInputBuilder()
      .setCustomId("tekst")
      .setLabel("Twoja opinia")
      .setStyle(TextInputStyle.Paragraph);

    const obs = new TextInputBuilder()
      .setCustomId("obs")
      .setLabel("Obsługa (1-5)")
      .setStyle(TextInputStyle.Short);

    const czas = new TextInputBuilder()
      .setCustomId("czas")
      .setLabel("Czas realizacji (1-5)")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(
      new ActionRowBuilder().addComponents(tekst),
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
      .setTitle("⭐ Nowa opinia")
      .setColor("Gold")
      .setDescription(tekst)
      .addFields(
        { name: "Obsługa", value: `${obs}/5 ⭐`, inline: true },
        { name: "Czas", value: `${czas}/5 ⭐`, inline: true }
      );

    return interaction.reply({ embeds: [embed] });
  }

});

client.login(process.env.TOKEN);
