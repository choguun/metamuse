// frontend/src/hooks/useMetaMuse.ts
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { METAMUSE_ABI, CONTRACTS, API_BASE_URL } from '@/constants';
import { type MuseTraits } from '@/types';

interface PendingMuse {
  traits: MuseTraits;
  status: 'creating' | 'confirming' | 'completed';
  dnaHash?: string;
  txHash?: string;
}

export function useMetaMuse() {
  const { address } = useAccount();
  const router = useRouter();
  const [pendingMuses, setPendingMuses] = useState<Map<string, PendingMuse>>(new Map());
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const generateTempId = () => Math.random().toString(36).substr(2, 9);
  
  const handleCreateMuse = useCallback(async (traits: MuseTraits) => {
    try {
      if (!address) throw new Error('Wallet not connected');
      
      // 1. Call backend to prepare muse
      const preparation = await fetch(`${API_BASE_URL}/api/v1/muses/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traits, creator_address: address }),
      }).then(r => r.json());
      
      // 2. Store pending muse
      const pendingId = generateTempId();
      setPendingMuses(prev => new Map(prev).set(pendingId, {
        traits,
        status: 'creating',
        dnaHash: preparation.dna_hash,
      }));
      
      // 3. Execute contract transaction
      writeContract({
        address: CONTRACTS.MetaMuse,
        abi: METAMUSE_ABI,
        functionName: 'createMuse',
        args: [
          traits.creativity,
          traits.wisdom,
          traits.humor,
          traits.empathy,
        ],
      });
      
      return { pendingId };
      
    } catch (error) {
      console.error('Failed to create muse:', error);
      throw error;
    }
  }, [writeContract, address]);

  // Effect to handle successful transactions
  useEffect(() => {
    if (isSuccess && hash) {
      // Clear pending muses on success
      setPendingMuses(new Map());
      
      // Redirect to gallery or show success message
      router.push('/gallery');
    }
  }, [isSuccess, hash, router]);
  
  return {
    createMuse: handleCreateMuse,
    pendingMuses: Array.from(pendingMuses.values()),
    isCreating: isPending || isConfirming,
    isSuccess,
  };
}