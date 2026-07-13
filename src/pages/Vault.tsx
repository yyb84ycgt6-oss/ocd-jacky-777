import { VaultShell } from '@/vault/VaultShell';
import { VaultProvider } from '@/vault/VaultContext';

export default function Vault() {
  return (
    <VaultProvider>
      <VaultShell />
    </VaultProvider>
  );
}
