module.exports = async (client, guildId) => {
    let ApplicationCommands;

    if (guildId) {
        const guild = await client.guilds.fetch(guildId);
        ApplicationCommands = guild.commands;
    } else {
            ApplicationCommands = client.application.commands;
        }

    await ApplicationCommands.fetch();
    return ApplicationCommands;
}