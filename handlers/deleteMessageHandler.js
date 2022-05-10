const deleteMessageHandler = async (ctx, next) => {
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.error("Error deleting\n", error);
  }
  if (next) {
    await next();
  }
};
const deleteByMessageId = async (ctx, messageIds) => {
  console.log("messageIds: ", messageIds);
  try {
    messageIds.forEach(async (messageId) => await ctx.deleteMessage(messageId));
  } catch (error) {
    console.error("Error deleting\n", error);
  }
};

module.exports = { deleteMessageHandler, deleteByMessageId };
