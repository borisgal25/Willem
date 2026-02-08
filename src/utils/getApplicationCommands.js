module.exports = async (client, guildId) => {
  let applicationCommands;

  if (guildId) {
    try {
      const guild = await client.guilds.fetch(guildId);
      applicationCommands = guild.commands;
    } catch (error) {
      console.log(
        `⚠️ Could not fetch test server (${guildId}). Falling back to global commands.`,
      );
      console.log(`   Error: ${error.message}`);
      applicationCommands = await client.application.commands;
    }
  } else {
    applicationCommands = await client.application.commands;
  }

  await applicationCommands.fetch();
  return applicationCommands;
};
