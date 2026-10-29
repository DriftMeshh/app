import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { WalletProvider } from '../src/wallet/WalletContext';

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(<WalletProvider>{ui}</WalletProvider>, options);
}
