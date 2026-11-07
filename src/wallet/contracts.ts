import { Client as SubscriptionMarketClient } from 'subscription-market';
import { Client as PaymentStreamerClient } from 'payment-streamer';
import { stellarConfig } from '../stellarConfig';
import { signTransaction, signAuthEntry } from './kit';

function baseOptions(address: string) {
  return {
    publicKey: address,
    signTransaction,
    signAuthEntry,
    networkPassphrase: stellarConfig.networkPassphrase,
    rpcUrl: stellarConfig.rpcUrl,
  };
}

/**
 * Reads the live per-period subscription price (in stroops) from
 * subscription-market. No wallet needed — this is a read-only call, so it
 * omits `publicKey`, which makes the SDK simulate against a null account
 * instead of looking one up on-chain.
 */
export async function getSubscriptionPrice(): Promise<bigint> {
  const client = new SubscriptionMarketClient({
    contractId: stellarConfig.subscriptionMarketContractId,
    networkPassphrase: stellarConfig.networkPassphrase,
    rpcUrl: stellarConfig.rpcUrl,
  });
  const tx = await client.get_price();
  return tx.result;
}

/** Subscribes `address` for `periods`, paying straight into payment-streamer's balance. Returns the new expiry (unix seconds). */
export async function subscribe(address: string, periods: number): Promise<bigint> {
  const client = new SubscriptionMarketClient({
    ...baseOptions(address),
    contractId: stellarConfig.subscriptionMarketContractId,
  });
  const tx = await client.subscribe({ subscriber: address, periods });
  const sent = await tx.signAndSend();
  return sent.result.unwrap();
}

/** Claims `address`'s payout for `epoch`. Returns the amount paid out. */
export async function claim(address: string, epoch: number): Promise<bigint> {
  const client = new PaymentStreamerClient({
    ...baseOptions(address),
    contractId: stellarConfig.paymentStreamerContractId,
  });
  const tx = await client.claim({ device: address, epoch });
  const sent = await tx.signAndSend();
  return sent.result.unwrap();
}
