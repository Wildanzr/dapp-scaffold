import create, { State } from "zustand";
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createMintToInstruction,
} from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";

interface TestTokenStore extends State {
  tokenSupply: number;
  getTokenSupply: (connection: Connection, tokenMintAddress: PublicKey) => void;
  mintTokens: (
    connection: Connection,
    mint: PublicKey,
    amount: number,
    userWallet: WalletContextState
  ) => void;
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

  mintTokens: async (connection, mint, amount, wallet) => {
    const fromWallet = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.NEXT_PUBLIC_AUTHORITY_KEY_PAIR))
    );

    try {
      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet, // SIGNER SHOULD BE USER
        mint,
        fromWallet.publicKey // SHOULD BE USER PUBLIC KEY
      );
      console.log("Destination: ", toTokenAccount.address.toBase58());

      let transaction = new Transaction();

      const mintToInstruction = createMintToInstruction(
        mint,
        toTokenAccount.address,
        fromWallet.publicKey,
        amount * 10 ** 9
      );

      transaction.add(mintToInstruction);

      // FROM WALLET (SIGNER) SHOULD BE USER
      await sendAndConfirmTransaction(connection, transaction, [fromWallet]);

      console.log(`Minted ${amount} tokens to ${toTokenAccount.address}`);
    } catch (e) {
      console.log(`Error minting tokens: `, e);
    }
  },

  // transferToken: async (connection, recepient, sender) => {},
}));

export default useTestTokenStore;
