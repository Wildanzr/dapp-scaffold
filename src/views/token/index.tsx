/* eslint-disable @next/next/no-img-element */
// Next, React
import { FC, useEffect, useState } from "react";

// Wallet
import {
  useWallet,
  useConnection,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";

// Token
import useUserSOLBalanceStore from "stores/useUserSOLBalanceStore";
import { tokenAddress } from "constant/common";
import useTestTokenStore from "stores/useTestTokenStore";
import { PublicKey } from "@solana/web3.js";

export const TokenView: FC = ({}) => {
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();

  // const [refetch, setRefetch] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(0);
  const [recepient, setRecepient] = useState<string>("");
  const [amountTransfer, setAmountTransfer] = useState<number>(0);
  const [amountTransferIn, setAmountTransferIn] = useState<number>(0);
  const [amountTransferOut, setAmountTransferOut] = useState<number>(0);

  const tokenBalance = useUserSOLBalanceStore((s) => s.tokenBalance);
  const { getUserTokenBalance } = useUserSOLBalanceStore();

  const tokenSupply = useTestTokenStore((s) => s.tokenSupply);
  const { getTokenSupply, mintTokens, transferToken, transferIn, transferOut } =
    useTestTokenStore();

  useEffect(() => {
    if (wallet.publicKey) {
      console.log(wallet.publicKey.toBase58());
      getTokenSupply(connection, tokenAddress);
      getUserTokenBalance(wallet.publicKey, connection, tokenAddress);
    }
  }, [
    wallet.publicKey,
    connection,
    getUserTokenBalance,
    getTokenSupply,
    // refetch,
  ]);

  return (
    <div className="mx-auto p-6 w-screen max-w-7xl flex flex-col">
      <img
        src={
          "https://gateway.pinata.cloud/ipfs/QmYWfK5RjRYcDm5ngJsSvMQKTT4R5mmreb6do8DzJrQuXm"
        }
        alt="MEOWWED"
        width={100}
        height={100}
        className="rounded-full aspect-square object-cover self-center mb-4"
      />
      <div className="text-4xl font-semibold text-center mb-20">KOCHENGGG</div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-0 justify-between items-center w-full">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1  items-center ">
            <div className="text-xl">CURRENT TOKEN BALANCE:</div>
            <div className="font-bold text-xl">{tokenBalance || 0} KCG</div>
          </div>
          <div className="flex flex-col gap-1  items-center ">
            <div className="text-xl">TOKEN SUPPLY:</div>
            <div className="font-bold text-xl">{tokenSupply || 0} KCG</div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              mintTokens(tokenAddress, amount, anchorWallet, connection);
            }}
            className="border-[1px] border-white p-6 px-8  rounded-md flex flex-col gap-3"
          >
            <div className="font-semibold text-center mb-2">Mint Token</div>
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

        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              transferIn(
                tokenAddress,
                amountTransferIn,
                anchorWallet,
                connection
              );
            }}
            className="border-[1px] border-white p-6 px-8  rounded-md flex flex-col gap-3"
          >
            <div className="font-semibold text-center mb-2">Transfer In</div>
            <input
              value={amountTransferIn}
              onChange={(e) => setAmountTransferIn(parseInt(e.target.value))}
              type="number"
              placeholder="Amount"
              step={0.1}
              className="px-3 outline-none rounded-sm py-2 text-black"
            />

            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% rounded-md p-2"
            >
              Store
            </button>
          </form>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              transferOut(
                tokenAddress,
                amountTransferOut,
                anchorWallet,
                connection
              );
            }}
            className="border-[1px] border-white p-6 px-8  rounded-md flex flex-col gap-3"
          >
            <div className="font-semibold text-center mb-2">Transfer Out</div>
            <input
              value={amountTransferOut}
              onChange={(e) => setAmountTransferOut(parseInt(e.target.value))}
              type="number"
              placeholder="Amount"
              step={0.1}
              className="px-3 outline-none rounded-sm py-2 text-black"
            />

            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% rounded-md p-2"
            >
              Claim
            </button>
          </form>
        </div>

        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              transferToken(
                connection,
                tokenAddress,
                new PublicKey(recepient),
                wallet,
                amountTransfer
              );
            }}
            className="border-[1px] border-white p-6 px-8 rounded-md flex flex-col gap-3"
          >
            <div className="font-semibold text-center mb-2">Transfer Token</div>

            <input
              type="text"
              value={recepient}
              onChange={(e) => setRecepient(e.target.value)}
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

            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% rounded-md p-2"
            >
              Transfer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
