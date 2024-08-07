import create, { State } from "zustand";
import { Connection, PublicKey, Keypair, Transaction } from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@project-serum/anchor";
import { SplStandard } from "../types/spl_standard";
import {
  createTransferCheckedInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import { AnchorWallet, WalletContextState } from "@solana/wallet-adapter-react";
import {
  commitmentLevel,
  programId,
  TOKEN_ACCOUNT_OWNER_PDA,
  TOKEN_VAULT,
  tokenProgramId,
  tokenProgramInterface,
} from "constant/common";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import BN from "bn.js";
import { amount, token } from "@metaplex-foundation/js";

interface TestTokenStore extends State {
  tokenSupply: number;
  getTokenSupply: (connection: Connection, tokenMintAddress: PublicKey) => void;
  transferToken: (
    connection: Connection,
    mint: PublicKey,
    recepient: PublicKey,
    userWallet: WalletContextState,
    amount: number
  ) => void;
  mintTokens: (
    mint: PublicKey,
    quantity: number,
    userWallet: AnchorWallet,
    connection: Connection
  ) => void;
  transferIn: (
    mint: PublicKey,
    quantity: number,
    userWallet: AnchorWallet,
    connection: Connection
  ) => void;
  transferOut: (
    mint: PublicKey,
    quantity: number,
    userWallet: AnchorWallet,
    connection: Connection
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

  mintTokens: async (mint, quantity, wallet, connection) => {
    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: commitmentLevel,
    });
    if (!provider) return;

    const program = new Program(
      tokenProgramInterface,
      tokenProgramId,
      provider
    ) as Program<SplStandard>;

    let destination = await getAssociatedTokenAddress(mint, wallet.publicKey);
    try {
      await getAccount(connection, destination);
    } catch {
      const createInstruction = createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        destination,
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

    try {
      const context = {
        associatedTokenProgram: programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        mint: mint,
        destination: destination,
        payer: wallet.publicKey,
        rent: web3.SYSVAR_RENT_PUBKEY,
        systemProgram: web3.SystemProgram.programId,
      };

      const txHash = await program.methods
        .mintTokens(new BN(quantity * 10 ** 9))
        .accounts(context)
        .rpc();

      console.log(
        `Succesfully mint ${quantity} tokens to ${wallet.publicKey.toBase58()}`
      );
      console.log(txHash);

      return txHash;
    } catch (err) {
      console.log("Transaction error: ", err);
      return;
    }
  },

  transferIn: async (mint, quantity, wallet, connection) => {
    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: commitmentLevel,
    });
    if (!provider) return;

    const program = new Program(
      tokenProgramInterface,
      tokenProgramId,
      provider
    ) as Program<SplStandard>;

    let [tokenAccountOwnerPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(TOKEN_ACCOUNT_OWNER_PDA)],
      program.programId
    );

    let [tokenVault] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(TOKEN_VAULT), mint.toBuffer()],
      program.programId
    );

    const tokenAccount = await getAssociatedTokenAddress(
      mint,
      wallet.publicKey
    );

    const context = {
      tokenAccountOwnerPda,
      vaultTokenAccount: tokenVault,
      senderTokenAccount: tokenAccount,
      mintOfTokenBeingSent: mint,
      signer: wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: web3.SYSVAR_RENT_PUBKEY,
    };

    const txHash = await program.methods
      .transferIn(new BN(quantity * 10 ** 9))
      .accounts(context)
      .rpc();

    console.log(`Sucessfully transfer in ${quantity} tokens to vault`);
    console.log(txHash);

    return txHash;
  },

  transferOut: async (mint, quantity, wallet, connection) => {
    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: commitmentLevel,
    });
    if (!provider) return;

    const program = new Program(
      tokenProgramInterface,
      tokenProgramId,
      provider
    ) as Program<SplStandard>;

    let [tokenAccountOwnerPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(TOKEN_ACCOUNT_OWNER_PDA)],
      program.programId
    );
    let [tokenVault] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(TOKEN_VAULT), mint.toBuffer()],
      program.programId
    );

    const tokenAccount = await getAssociatedTokenAddress(
      mint,
      wallet.publicKey
    );
    // CREATE TOKEN ACCOUNT IF NOT YET EXIST
    try {
      await getAccount(connection, tokenAccount);
    } catch {
      const createInstruction = createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        tokenAccount,
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

    const context = {
      tokenAccountOwnerPda,
      vaultTokenAccount: tokenVault,
      senderTokenAccount: tokenAccount,
      mintOfTokenBeingSent: mint,
      signer: wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: web3.SYSVAR_RENT_PUBKEY,
    };

    const txHash = await program.methods
      .transferOut(new BN(quantity * 10 ** 9))
      .accounts(context)
      .rpc();

    console.log(
      `Sucessfully transfer out ${quantity} tokens from vault to ${tokenAccount.toBase58()}`
    );
    console.log(txHash);

    return txHash;
  },
}));

export default useTestTokenStore;
