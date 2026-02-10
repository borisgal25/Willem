const {
  AudioPlayerStatus,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
} = require("@discordjs/voice");
const playdl = require("play-dl");

const guildPlayers = new Map();

const getTextChannel = (interaction, voiceChannel) => {
  if (voiceChannel?.isTextBased?.()) {
    return voiceChannel;
  }

  if (interaction.channel?.isTextBased?.()) {
    return interaction.channel;
  }

  return null;
};

const destroyPlayer = (guildId) => {
  const state = guildPlayers.get(guildId);
  if (!state) return;

  try {
    state.player.stop(true);
  } catch (error) {
    console.log("Error stopping player:", error);
  }

  try {
    state.connection.destroy();
  } catch (error) {
    console.log("Error destroying connection:", error);
  }

  guildPlayers.delete(guildId);
};

const playNext = async (guildId) => {
  const state = guildPlayers.get(guildId);
  if (!state || state.isProcessing) return;

  state.isProcessing = true;

  while (state.queue.length > 0) {
    const nextTrack = state.queue.shift();

    try {
      let streamInfo = null;

      if (nextTrack.url) {
        streamInfo = await playdl.stream(nextTrack.url);
      } else if (nextTrack.query) {
        const searchResults = await playdl.search(nextTrack.query, {
          limit: 1,
          source: { youtube: "video" },
        });

        if (!searchResults.length) {
          continue;
        }

        streamInfo = await playdl.stream(searchResults[0].url);
      } else {
        continue;
      }

      const resource = createAudioResource(streamInfo.stream, {
        inputType: streamInfo.type,
      });

      state.player.play(resource);
      if (state.textChannel) {
        const artist = nextTrack.artist || "Unknown Artist";
        await state.textChannel.send(
          `Now playing: **${nextTrack.title}** by **${artist}**`,
        );
      }

      state.isProcessing = false;
      return;
    } catch (error) {
      console.log("Error playing track:", error);
    }
  }

  state.isProcessing = false;
  if (state.textChannel) {
    await state.textChannel.send("Queue finished.");
  }
  destroyPlayer(guildId);
};

const startPlayback = async ({ interaction, voiceChannel, tracks }) => {
  const existingPlayer = guildPlayers.get(interaction.guild.id);
  if (existingPlayer) {
    destroyPlayer(interaction.guild.id);
  }

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  await entersState(connection, VoiceConnectionStatus.Ready, 15_000);

  const player = createAudioPlayer();
  connection.subscribe(player);

  const state = {
    queue: tracks,
    connection,
    player,
    textChannel: getTextChannel(interaction, voiceChannel),
    isProcessing: false,
  };

  guildPlayers.set(interaction.guild.id, state);

  player.on(AudioPlayerStatus.Idle, () => {
    playNext(interaction.guild.id);
  });

  player.on("error", (error) => {
    console.log("Audio player error:", error);
    playNext(interaction.guild.id);
  });

  await playNext(interaction.guild.id);
};

module.exports = {
  startPlayback,
};
