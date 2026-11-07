import User from "../models/User.js";

// Ensure AI Bot user exists in database for messages and sidebar
export const getOrCreateBotUser = async () => {
  let bot = await User.findOne({ email: "ai.bot@chatapp.local" });
  if (!bot) {
    bot = await User.create({
      name: "ChatApp AI",
      email: "ai.bot@chatapp.local",
      password: "bot_system_account_no_direct_login",
      profilePic: "https://api.dicebear.com/7.x/bottts/svg?seed=ChatAppAI",
      about: "I'm your AI Assistant! Chat with me directly or type @ai in any group.",
    });
  } else if (bot.name !== "ChatApp AI") {
    // Update existing record in MongoDB to remove the emoji
    bot.name = "ChatApp AI";
    await bot.save();
  }
  return bot;
};
