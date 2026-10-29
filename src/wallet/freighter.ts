import freighterApi from '@stellar/freighter-api';

export class WalletError extends Error {}

/** Whether the Freighter browser extension is present at all (not whether this site is approved). */
export async function isFreighterAvailable(): Promise<boolean> {
  try {
    const { isConnected, error } = await freighterApi.isConnected();
    return !error && isConnected;
  } catch {
    return false;
  }
}

/** Prompts the user to connect, returning their public address. */
export async function connectWallet(): Promise<string> {
  const { address, error } = await freighterApi.requestAccess();
  if (error || !address) {
    throw new WalletError(
      typeof error === 'string' ? error : (error?.message ?? 'Could not connect to Freighter'),
    );
  }
  return address;
}

/**
 * Wrapped to throw instead of returning `{ error }`, so callers can use
 * ordinary try/catch — and so a user declining the signature prompt in
 * Freighter surfaces as a catchable error, not a silently-wrong value.
 */
export async function signTransaction(
  xdr: string,
  opts?: { networkPassphrase?: string; address?: string },
): Promise<{ signedTxXdr: string; signerAddress?: string }> {
  const result = await freighterApi.signTransaction(xdr, opts);
  if (result.error) {
    throw new WalletError(result.error.message ?? 'Failed to sign transaction');
  }
  return result;
}

export async function signAuthEntry(
  entryXdr: string,
  opts?: { networkPassphrase?: string; address?: string },
): Promise<{ signedAuthEntry: string; signerAddress?: string }> {
  const result = await freighterApi.signAuthEntry(entryXdr, opts);
  if (result.error) {
    throw new WalletError(result.error.message ?? 'Failed to sign auth entry');
  }
  return { signedAuthEntry: result.signedAuthEntry ?? '', signerAddress: result.signerAddress };
}
