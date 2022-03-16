const formatTxnData = (transaction) => {
  const feeData = transaction.fee.quantity
    ? `\n<b>Fee:</b> <i>${transaction.fee.quantity / 1000000} ada</i>`
    : ``;
  return `<b>ID:</b> <i>${`${transaction.id.slice(
    0,
    7
  )}...${transaction.id.slice(-7)}`}</i>
<b>Amount:</b> <i>${transaction.amount.quantity / 1000000} ada</i>${feeData}
<b>Type:</b> <i>${
    transaction.direction === "outgoing" ? `🔺 Outgoing` : `🟢 Incoming`
  }</i>
${
  transaction.inserted_at?.time
    ? `<b>Inserted at:</b> <i>${String(
        new Date(transaction.inserted_at.time)
      )}</i>\n`
    : ""
}${
    transaction.expires_at?.time
      ? `<b>Expires at:</b> <i>${String(
          new Date(transaction.expires_at.time)
        )}</i>\n`
      : ""
  }${
    transaction.pending_since?.time
      ? `<b>Submitted at:</b> <i>${String(
          new Date(transaction.pending_since.time)
        )}</i>\n`
      : ""
  }<b>Status:</b> <i>${transaction.status.replace(/^_*(.)|_+(.)/g, (s, c, d) =>
    c ? c.toUpperCase() : " " + d.toUpperCase()
  )}</i>`;
};

module.exports = { formatTxnData };
