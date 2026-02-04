const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'Bans a member from the server',
    // devOnly: boolean
    // testOnly: boolean
    options: [
        {
            name: 'user',
            description: 'The user to ban',
            type: ApplicationCommandOptionType.Mentionable,
            required: true,
        },
        {
            name: 'reason',
            description: 'The reason for the ban',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.Admin],

    callback: (client, interaction) => {
        interaction.reply(`Ban...`);
    }
}