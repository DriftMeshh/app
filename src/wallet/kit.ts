import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk';
import { Networks, SwkAppDarkTheme } from '@creit.tech/stellar-wallets-kit/types';
import { VarialModule as FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { LobstrModule } from '@creit.tech/stellar-wallets-kit/modules/lobstr';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';
import { RabetModule } from '@creit.tech/stellar-wallets-kit/modules/rabet';
import { stellarConfig } from '../stellarConfig';

export class WalletError extends Error {}

let initialized = false;

/** Lazy — the kit touches `window`, so this must never run during SSR/tests that don't need it. */
function ensureInitialized(): void {
  if (initialized) return;
  StellarWalletsKit.init({
    modules: [
      new FreighterModule(),
      new LobstrModule(),
      new xBullModule(),
      new AlbedoModule(),
      new RabetModule(),
    ],
    network:
      stellarConfig.networkPassphrase === Networks.PUBLIC ? Networks.PUBLIC : Networks.TESTNET,
    theme: SwkAppDarkTheme,
  });
  initialized = true;
}

/**
 * Opens the kit's built-in wallet picker (Freighter, Lobstr, xBull, Albedo,
 * Rabet) and resolves once the user has picked one and approved the
 * connection. Throws if they close the modal or decline.
 */
export async function connectWallet(): Promise<string> {
  ensureInitialized();
  try {
    const { address } = await StellarWalletsKit.authModal();
    if (!address) throw new WalletError('No address returned from wallet');
    return address;
  } catch (err) {
    if (err instanceof WalletError) throw err;
    throw new WalletError(err instanceof Error ? err.message : String(err));
  }
}

export async function disconnectWallet(): Promise<void> {
  if (!initialized) return;
  await StellarWalletsKit.disconnect();
}

export async function signTransaction(
  xdr: string,
  opts?: { networkPassphrase?: string; address?: string },
): Promise<{ signedTxXdr: string; signerAddress?: string }> {
  ensureInitialized();
  try {
    return await StellarWalletsKit.signTransaction(xdr, opts);
  } catch (err) {
    throw new WalletError(err instanceof Error ? err.message : String(err));
  }
}

export async function signAuthEntry(
  entryXdr: string,
  opts?: { networkPassphrase?: string; address?: string },
): Promise<{ signedAuthEntry: string; signerAddress?: string }> {
  ensureInitialized();
  try {
    return await StellarWalletsKit.signAuthEntry(entryXdr, opts);
  } catch (err) {
    throw new WalletError(err instanceof Error ? err.message : String(err));
  }
}
