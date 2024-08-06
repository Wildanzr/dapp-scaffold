import create, { State } from "zustand";
import { Connection, PublicKey, Keypair, Transaction } from "@solana/web3.js";
import {
  createTransferCheckedInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount,
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
  transferToken: (
    connection: Connection,
    mint: PublicKey,
    recepient: PublicKey,
    userWallet: WalletContextState,
    amount: number
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
    let associatedTokenAddress: PublicKey;

    // CHECK IF ASSOCIATED TOKEN ACCOUNT EXIST OR NOT
    try {
      associatedTokenAddress = await getAssociatedTokenAddress(
        mint,
        wallet.publicKey
      );
      await getAccount(connection, associatedTokenAddress);
    } catch {
      const createInstruction = createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        associatedTokenAddress,
        wallet.publicKey,
        mint
      );
      let transaction = new Transaction();
      transaction.add(createInstruction);
      const blockHash = await connection.getLatestBlockhash();
      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = blockHash.blockhash;
      const signed = await wallet.signTransaction(transaction);
      await connection.sendRawTransaction(signed.serialize());
    }

    // PROCEED TO MINTING
    try {
      const mintToInstruction = createMintToInstruction(
        mint,
        associatedTokenAddress,
        fromWallet.publicKey,
        amount * 10 ** 9
      );
      let transaction = new Transaction();
      transaction.add(mintToInstruction);

      const blockHash = await connection.getLatestBlockhash();
      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = blockHash.blockhash;

      const signed = await wallet.signTransaction(transaction);
      await connection.sendRawTransaction(signed.serialize());

      console.log(`Minted ${amount} tokens to ${associatedTokenAddress}`);

      window.location.reload();
    } catch (e) {
      console.log(`Error minting tokens: `, e);
    }
  },

  transferToken: async (connection, mint, recepient, wallet, amount) => {
    const decimal = 9;
    const fromWallet = await getAssociatedTokenAddress(mint, wallet.publicKey);

    let toWallet: PublicKey;
    try {
      toWallet = await getAssociatedTokenAddress(mint, recepient);
      await getAccount(connection, toWallet);
    } catch {
      const createInstruction = createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        toWallet,
        recepient,
        mint
      );
      let transaction = new Transaction();
      transaction.add(createInstruction);

      const blockHash = await connection.getLatestBlockhash();
      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = blockHash.blockhash;

      const signed = await wallet.signTransaction(transaction);
      await connection.sendRawTransaction(signed.serialize());
    }

    const instruction = createTransferCheckedInstruction(
      fromWallet,
      mint,
      toWallet,
      wallet.publicKey,
      amount * 10 ** 9,
      decimal
    );

    let transaction = new Transaction();
    transaction.add(instruction);

    const blockHash = await connection.getLatestBlockhash();
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = blockHash.blockhash;

    const signed = await wallet.signTransaction(transaction);
    await connection.sendRawTransaction(signed.serialize());

    console.log(`Transfer ${amount} tokens to ${toWallet}`);

    window.location.reload();
  },
}));

export default useTestTokenStore;
