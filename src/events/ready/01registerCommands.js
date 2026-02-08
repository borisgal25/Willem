const { testServer } = require("../../../config.json");
const areCommandsDifferent = require("../../utils/areCommandsDifferent");
const getApplicationCommands = require("../../utils/getApplicationCommands");
const getLocalCommands = require("../../utils/getLocalCommands");

module.exports = async (client) => {
  const localCommands = getLocalCommands();

  // Verwijder oude globale commands als we een test server gebruiken
  if (testServer) {
    try {
      const globalCommands = await client.application.commands.fetch();
      if (globalCommands.size > 0) {
        console.log(`🧹 Removing ${globalCommands.size} global command(s)...`);
        await client.application.commands.set([]);
        console.log(`✅ Global commands cleared`);
      }
    } catch (error) {
      console.log(`⚠️ Could not clear global commands: ${error.message}`);
    }
  }

  const applicationCommands = await getApplicationCommands(client, testServer);

  for (const localCommand of localCommands) {
    const { name, description, options } = localCommand;

    const existingCommand = applicationCommands.cache.find(
      (cmd) => cmd.name === name,
    );

    if (existingCommand) {
      if (localCommand.deleted) {
        await applicationCommands.delete(existingCommand.id);
        console.log(`🗑️ Deleted command ${name}`);
        continue;
      }

      if (areCommandsDifferent(existingCommand, localCommand)) {
        await applicationCommands.edit(existingCommand.id, {
          description,
          options,
        });
        console.log(`✏️ Updated command ${name}`);
      }
    } else {
      if (localCommand.deleted) {
        console.log(
          `❌ Skipped registering command "${name}" because it's marked as deleted`,
        );
        continue;
      }

      await applicationCommands.create({
        name,
        description,
        options,
      });

      console.log(`✅ Registered command ${name}`);
    }
  }
};
