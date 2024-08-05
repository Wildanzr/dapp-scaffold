/* eslint-disable @next/next/no-img-element */
// Next, React
import { FC, useEffect, useState } from "react";

// Wallet
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

// Token
import useUserSOLBalanceStore from "stores/useUserSOLBalanceStore";
import { tokenMintAddress } from "constant/common";
import useTestTokenStore from "stores/useTestTokenStore";
import { Keypair } from "@solana/web3.js";

export const TokenView: FC = ({}) => {
  const wallet = useWallet();
  const { connection } = useConnection();

  const [amount, setAmount] = useState<number>(0);
  const [amountTransfer, setAmountTransfer] = useState<number>(0);

  const tokenBalance = useUserSOLBalanceStore((s) => s.tokenBalance);
  const { getUserTokenBalance } = useUserSOLBalanceStore();

  const tokenSupply = useTestTokenStore((s) => s.tokenSupply);
  const { getTokenSupply, mintTokens } = useTestTokenStore();

  useEffect(() => {
    if (wallet.publicKey) {
      console.log(wallet.publicKey.toBase58());
      getTokenSupply(connection, tokenMintAddress);
      getUserTokenBalance(wallet.publicKey, connection, tokenMintAddress);
    }
  }, [wallet.publicKey, connection, getUserTokenBalance, getTokenSupply]);

  return (
    <div className="mx-auto p-6 w-screen max-w-7xl flex flex-col">
      <img
        src={"https://pbs.twimg.com/media/EHPhZNXXkAEqXQ-.jpg"}
        alt="KCH"
        width={100}
        height={100}
        className="rounded-full aspect-square object-cover self-center mb-4"
      />
      <div className="text-4xl font-semibold text-center mb-20">KOCHENGGG</div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-0 justify-between items-center w-full">
        <div className="flex flex-col gap-16">
          <div className="flex flex-col gap-1  items-center ">
            <div className="text-xl">CURRENT TOKEN BALANCE:</div>
            <div className="font-bold text-xl">{tokenBalance || 0} KCH</div>
          </div>
          <div className="flex flex-col gap-1  items-center ">
            <div className="text-xl">TOKEN SUPPLY:</div>
            <div className="font-bold text-xl">{tokenSupply || 0} KCH</div>
          </div>
        </div>

        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mintTokens(connection, tokenMintAddress, amount);
            }}
            className="border-[1px] border-white p-6 px-8  rounded-md flex flex-col gap-3"
          >
            <div className="font-semibold text-center mb-2">Mint KCH Token</div>
            <input
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value))}
              type="number"
              placeholder="Amount"
              step={0.1}
              className="px-3 outline-none rounded-sm py-2 text-black"
            />

            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% rounded-md p-2"
            >
              Mint
            </button>
          </form>
        </div>

        <div>
          <div className="border-[1px] border-white p-6 px-8 rounded-md flex flex-col gap-3">
            <div className="font-semibold text-center mb-2">
              Transfer KCH Token
            </div>

            <input
              type="text"
              placeholder="Recepient Address"
              className="px-3 outline-none rounded-sm py-2 text-black"
            />

            <input
              type="number"
              placeholder="Amount"
              step={0.1}
              onChange={(e) => setAmountTransfer(parseInt(e.target.value))}
              value={amountTransfer}
              className="px-3 outline-none rounded-sm py-2 text-black"
            />

            <button className="bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% rounded-md p-2">
              Transfer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
