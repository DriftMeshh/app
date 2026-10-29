export const stellarConfig = {
  rpcUrl: import.meta.env.VITE_STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org',
  networkPassphrase:
    import.meta.env.VITE_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015',
  paymentStreamerContractId: import.meta.env.VITE_PAYMENT_STREAMER_CONTRACT_ID ?? '',
  subscriptionMarketContractId: import.meta.env.VITE_SUBSCRIPTION_MARKET_CONTRACT_ID ?? '',
};
