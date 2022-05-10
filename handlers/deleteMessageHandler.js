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

const deletePastMessagesHandler = async (ctx, next) => {
  const toDelete = ctx.session.messageIdsToDelete || [];
  if (ctx.update.callback_query) {
    const message_id = ctx.update.callback_query.message.message_id;
    !toDelete.includes(message_id) && toDelete.push(message_id);
  }
  if (Array.isArray(toDelete)) {
    for (let messageId of toDelete) {
      try {
        await ctx.deleteMessage(messageId);
      } catch (e) {
        console.log(e);
      }
    }
    ctx.session.messageIdsToDelete = [];
  }
  if (next) {
    return next();
  }
  return;
};

module.exports = {
  deleteMessageHandler,
  deletePastMessagesHandler,
};
