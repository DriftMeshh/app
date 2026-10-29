import { Client as SubscriptionMarketClient } from 'subscription-market';
import { Client as PaymentStreamerClient } from 'payment-streamer';
import { stellarConfig } from '../stellarConfig';
import { signTransaction, signAuthEntry } from './freighter';

function baseOptions(address: string) {
  return {
    publicKey: address,
    signTransaction,
    signAuthEntry,
    networkPassphrase: stellarConfig.networkPassphrase,
    rpcUrl: stellarConfig.rpcUrl,
  };
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
