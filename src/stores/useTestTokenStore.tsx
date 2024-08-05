import create, { State } from "zustand";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { mintTo, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

interface TestTokenStore extends State {
  tokenSupply: number;
  getTokenSupply: (connection: Connection, tokenMintAddress: PublicKey) => void;
  mintTokens: (connection: Connection, mint: PublicKey, amount: number) => void;
}

const useTestTokenStore = create<TestTokenStore>((set, _get) => ({
  tokenSupply: 0,

  getTokenSupply: async (connection, tokenMintAddress) => {
    let tokenSupply = 0;
    try {
      const tokenSupplyInfo = await connection.getTokenSupply(tokenMintAddress);
      tokenSupply = tokenSupplyInfo.value.uiAmount;
    } catch (e) {
      console.log(`Error getting token supply: `, e);
    }
    set((s) => {
      s.tokenSupply = tokenSupply;
      console.log(`Token supply updated: `, tokenSupply);
    });
  },

  mintTokens: async (connection, mint, amount) => {
    const fromWallet = Keypair.fromSecretKey(
      Uint8Array.from([
        57, 126, 253, 103, 115, 102, 223, 163, 178, 151, 6, 100, 77, 76, 203,
        174, 48, 246, 129, 26, 4, 120, 248, 107, 16, 248, 241, 112, 17, 150, 97,
        92, 125, 161, 121, 51, 56, 31, 78, 195, 142, 31, 107, 185, 233, 243, 10,
        216, 38, 94, 215, 128, 55, 127, 207, 203, 43, 195, 186, 250, 151, 146,
        68, 109,
      ])
    );

    try {
      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        mint,
        fromWallet.publicKey
      );

      await mintTo(
        connection,
        fromWallet,
        mint,
        toTokenAccount.address,
        fromWallet.publicKey,
        amount
      );

      console.log(`Minted ${amount} tokens to ${toTokenAccount.address}`);
    } catch (e) {
      console.log(`Error minting tokens: `, e);
    }
  },

  // transferToken: async (connection, recepient, sender) => {},
}));

export default useTestTokenStore;
