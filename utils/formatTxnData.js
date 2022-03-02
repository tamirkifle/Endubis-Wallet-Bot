const formatTxnData = (transaction) => {
  return `Txn ID: ${transaction.id}
Txn Amount: ${transaction.amount.quantity / 1000000} ada
Txn Fee: ${transaction.fee.quantity / 1000000} ada
${
  transaction.inserted_at?.time
    ? `Inserted at: ${String(new Date(transaction.inserted_at.time))}\n`
    : ""
}${
    transaction.expires_at?.time
      ? `Expires at: ${String(new Date(transaction.expires_at.time))}\n`
      : ""
  }${
    transaction.pending_since?.time
      ? `Submitted at: ${String(new Date(transaction.pending_since.time))}\n`
      : ""
  }Status: ${transaction.status}`;
};

module.exports = { formatTxnData };
