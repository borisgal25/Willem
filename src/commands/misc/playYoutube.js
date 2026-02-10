const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");
const playdl = require("play-dl");
const { startPlayback } = require("../../utils/musicPlayer");

const MUSIC_VOICE_CHANNEL_ID = "1456358832639971531";

const isYoutubeUrl = (input) => {
  if (!input) return false;
  return (
    /youtube\.com\/watch\?v=/.test(input) ||
    /youtu\.be\//.test(input) ||
    /[?&]list=/.test(input)
  );
};

const fetchYoutubeTracks = async (url) => {
  // Check if it's a playlist
  if (/[?&]list=/.test(url)) {
    const playlist = await playdl.playlist_info(url, {
      incomplete: true,
    });
    const videos = await playlist.all_videos();
    return videos.map((video) => ({
      title: video.title || "Unknown Title",
      artist: video.channel?.name || "YouTube",
      url: video.url,
    }));
  }

  // Single video
  const videoInfo = await playdl.video_info(url);
  return [
    {
      title: videoInfo.video_details.title || "Unknown Title",
      artist: videoInfo.video_details.channel?.name || "YouTube",
      url: videoInfo.video_details.url,
    },
  ];
};

module.exports = {
  name: "play-youtube",
  description: "Play a YouTube video or playlist in the configured voice channel.",
  options: [
    {
      name: "url",
      description: "YouTube video or playlist link.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.ViewChannel],
  botPermissions: [
    PermissionFlagsBits.Connect,
    PermissionFlagsBits.Speak,
    PermissionFlagsBits.ViewChannel,
  ],

  callback: async (client, interaction) => {
    await interaction.deferReply();

    const youtubeUrl = interaction.options.getString("url");
    if (!isYoutubeUrl(youtubeUrl)) {
      await interaction.editReply(
        "That does not look like a valid YouTube link.",
      );
      return;
    }

    const voiceChannel = await interaction.guild.channels.fetch(
      MUSIC_VOICE_CHANNEL_ID,
    );

    if (!voiceChannel || !voiceChannel.isVoiceBased?.()) {
      await interaction.editReply(
        "Configured voice channel was not found in this server.",
      );
      return;
    }

    let tracks = [];
    try {
      tracks = await fetchYoutubeTracks(youtubeUrl);
    } catch (error) {
      console.log("Error fetching YouTube content:", error);
      await interaction.editReply(
        "Unable to read that YouTube link. Is it public?",
      );
      return;
    }

    if (!tracks.length) {
      await interaction.editReply("No tracks found.");
      return;
    }

    try {
      await startPlayback({
        interaction,
        voiceChannel,
        tracks,
      });
    } catch (error) {
      await interaction.editReply("Failed to join the voice channel.");
      return;
    }

    await interaction.editReply(
      `Loaded ${tracks.length} track(s). Starting playback in <#${voiceChannel.id}>.`,
    );
  },
};
