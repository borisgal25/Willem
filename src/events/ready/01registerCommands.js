const { testServer } = require("../../config.json");

module.exports = async (client) => {
  try {
    const localCommands = require("../../utils/getLocalCommands");
    const applicationCommands = await getApplicationCommands(
      client,
      testServer,
    );

    for (const localCommand of localCommands) {
      const { name, description, options } = localCommand;

      const exsistingCommand = applicationCommands.cache.find(
        (cmd) => cmd.name === name,
      );
    }
  } catch (error) {
    console.log(`There was an error: ${error}`);
  }
};
