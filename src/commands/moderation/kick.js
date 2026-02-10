const {
  Client,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  /**
   * 
   * @param {Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  
  callback: async (client, interaction) => {
    const targetUserId = interaction.options.getMentionable("target-user")?.id;
    const reason = interaction.options.getString("reason") || "No reason provided.";

    await interaction.deferReply();

    const targetUser = await interaction.guild.members.fetch(targetUserId);

    if (!targetUser) {
      await interaction.editReply("That user doesn't exist in this server.");
      return;
    }

    if (targetUser.id === interaction.guild.ownerId) {
      await interaction.editReply("You cannot kick the server owner.");
      return;
    }

    const targetUserRolePosition = targetUser.roles.highest?.position || 0; // Get the highest role position of the target user
    const requesterRolePosition = interaction.member.roles.highest?.position || 0; // Get the highest role position of the requester
    const botRolePosition = interaction.guild.members.me.roles.highest?.position || 0; // Get the highest role position of the bot

    if (targetUserRolePosition >= requesterRolePosition) {
      await interaction.editReply("You cannot kick a user with an equal or higher role than you.");
      return;
    }

    if (targetUserRolePosition >= botRolePosition) {
      await interaction.editReply("I cannot kick a user with an equal or higher role than me.");
      return;
    }

    // Kick the targetUser
    try {
      await targetUser.kick(reason);
      await interaction.editReply(`User ${targetUser} has been kicked.\nReason: ${reason}`);
    } catch (error) {
      console.error("Error kicking user:", error);
      await interaction.editReply(`There was an error when kicking: ${error}`);
    }

  },

  name: "kick",
  description: "Kicks a member from the server.",
  options: [
    {
      name: "target-user",
      description: "The user to kick.",
      type: ApplicationCommandOptionType.Mentionable,
      required: true,
    },
    {
      name: "reason",
      description: "The reason for kicking.",
      type: ApplicationCommandOptionType.String,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.KickMembers],
  botPermissions: [PermissionFlagsBits.KickMembers],
};
