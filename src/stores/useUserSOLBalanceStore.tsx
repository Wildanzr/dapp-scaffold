import create, { State } from "zustand";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

interface UserSOLBalanceStore extends State {
  balance: number;
  tokenBalance: number;

  getUserSOLBalance: (publicKey: PublicKey, connection: Connection) => void;
  getUserTokenBalance: (
    publicKey: PublicKey,
    connection: Connection,
    tokenMintAddress: PublicKey
  ) => void;
}

const useUserSOLBalanceStore = create<UserSOLBalanceStore>((set, _get) => ({
  balance: 0,
  tokenBalance: 0,

  getUserSOLBalance: async (publicKey, connection) => {
    let balance = 0;
    try {
      balance = await connection.getBalance(publicKey, "confirmed");
      balance = balance / LAMPORTS_PER_SOL;
    } catch (e) {
      console.log(`Error getting balance: `, e);
    }
    set((s) => {
      s.balance = balance;
      console.log(`SOL balance updated: `, balance);
    });
  },

  getUserTokenBalance: async (publicKey, connection, tokenMintAddress) => {
    let tokenBalance = 0;
    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );

      const tokenAccountInfo = tokenAccounts.value.find(
        (accountInfo) =>
          accountInfo.account.data.parsed.info.mint ===
          tokenMintAddress.toBase58()
      );

      if (tokenAccountInfo) {
        tokenBalance =
          tokenAccountInfo.account.data.parsed.info.tokenAmount.uiAmount;
      }
    } catch (e) {
      console.log(`Error getting token balance: `, e);
    }
    set((s) => {
      s.tokenBalance = tokenBalance;
      console.log(`Token balance updated: `, tokenBalance);
    });
  },
}));

export default useUserSOLBalanceStore;
