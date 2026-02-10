const playdl = require("play-dl");

let isInitialized = false;

const initializePlayDl = async () => {
  if (isInitialized) return;

  // Check if cookies are provided in .env
  if (process.env.YOUTUBE_COOKIE) {
    try {
      await playdl.setToken({
        youtube: {
          cookie: process.env.YOUTUBE_COOKIE,
        },
      });
      console.log("✅ YouTube authentication initialized with cookies");
    } catch (error) {
      console.log("⚠️ Failed to set YouTube cookies:", error.message);
    }
  } else {
    console.log("⚠️ No YOUTUBE_COOKIE found. YouTube playback may be unreliable.");
  }

  isInitialized = true;
};

module.exports = { initializePlayDl };
