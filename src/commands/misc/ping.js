module.exports = {
    name: 'ping',
    description: 'Pong!',
    // devOnly: boolean
    // testOnly: boolean
    // options: object[]

    callback: (client, interaction) => {
        interaction.reply(`Pong! ${client.ws.ping}ms`);
    }
}