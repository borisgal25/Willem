const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");
const { startPlayback } = require("../../utils/musicPlayer");
const SpotifyWebApi = require("spotify-web-api-node");

const MUSIC_VOICE_CHANNEL_ID = "1456358832639971531";

let spotifyClient = null;
let spotifyTokenExpiresAt = 0;

const getSpotifyClient = async () => {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET.");
  }

  if (!spotifyClient) {
    spotifyClient = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
  }

  if (Date.now() < spotifyTokenExpiresAt) {
    return spotifyClient;
  }

  const tokenData = await spotifyClient.clientCredentialsGrant();
  spotifyClient.setAccessToken(tokenData.body.access_token);
  spotifyTokenExpiresAt =
    Date.now() + tokenData.body.expires_in * 1000 - 60 * 1000;

  return spotifyClient;
};

const extractPlaylistId = (input) => {
  if (!input) return null;

  const spotifyUriMatch = input.match(/spotify:playlist:([a-zA-Z0-9]+)/);
  if (spotifyUriMatch?.[1]) return spotifyUriMatch[1];

  const urlMatch = input.match(/playlist\/([a-zA-Z0-9]+)(\?|$)/);
  if (urlMatch?.[1]) return urlMatch[1];

  return null;
};

const fetchPlaylistTracks = async (playlistId) => {
  const client = await getSpotifyClient();
  const tracks = [];
  let offset = 0;
  let hasNext = true;

  while (hasNext) {
    const response = await client.getPlaylistTracks(playlistId, {
      limit: 100,
      offset,
    });

    for (const item of response.body.items) {
      if (!item.track) continue;
      const title = item.track.name;
      const artist = item.track.artists?.[0]?.name || "Unknown Artist";
      tracks.push({
        title,
        artist,
        query: `${title} ${artist}`,
      });
    }

    offset += response.body.items.length;
    hasNext = Boolean(response.body.next);
  }

  return tracks;
};

module.exports = {
  name: "play-spotify",
  description:
    "Play a public Spotify playlist in the configured voice channel (paused).",
  options: [
    {
      name: "playlist",
      description: "Public Spotify playlist link.",
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

    await interaction.editReply(
      "Spotify integration is paused for now. Please use /play-youtube.",
    );
    return;

    const playlistInput = interaction.options.getString("playlist");
    const playlistId = extractPlaylistId(playlistInput);

    if (!playlistId) {
      await interaction.editReply(
        "That does not look like a valid Spotify playlist link.",
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

    const tracks = await fetchPlaylistTracks(playlistId);
    if (!tracks.length) {
      await interaction.editReply("No tracks found in that playlist.");
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
  },
};
