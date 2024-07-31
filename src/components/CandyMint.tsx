import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { FC, useCallback, useMemo } from "react";
import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from "../stores/useUserSOLBalanceStore";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  generateSigner,
  transactionBuilder,
  publicKey,
  some,
} from "@metaplex-foundation/umi";
import {
  fetchCandyMachine,
  getMerkleProof,
  getMerkleRoot,
  mintV2,
  mplCandyMachine,
  route,
  safeFetchCandyGuard,
} from "@metaplex-foundation/mpl-candy-machine";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { setComputeUnitLimit } from "@metaplex-foundation/mpl-toolbox";
import { clusterApiUrl } from "@solana/web3.js";
import bs58 from "bs58";
import { allowList } from "constant/common";

// These access the environment variables we defined in the .env file
const quicknodeEndpoint =
  process.env.NEXT_PUBLIC_RPC || clusterApiUrl("devnet");
const candyMachineAddress = publicKey(process.env.NEXT_PUBLIC_CANDY_MACHINE_ID);
const treasury = publicKey(process.env.NEXT_PUBLIC_TREASURY);

export const CandyMint: FC = () => {
  const { connection } = useConnection();
  const { wallet } = useWallet();
  const { getUserSOLBalance } = useUserSOLBalanceStore();

  const umi = useMemo(
    () =>
      wallet
        ? createUmi(quicknodeEndpoint)
            .use(walletAdapterIdentity(wallet.adapter))
            .use(mplCandyMachine())
            .use(mplTokenMetadata())
        : null,
    [wallet]
  );

  const onClick = useCallback(async () => {
    if (!wallet.adapter.publicKey) {
      console.log("error", "Wallet not connected!");
      notify({
        type: "error",
        message: "error",
        description: "Wallet not connected!",
      });
      return;
    }

    // Fetch the Candy Machine.
    const candyMachine = await fetchCandyMachine(umi, candyMachineAddress);
    // Fetch the Candy Guard.
    const candyGuard = await safeFetchCandyGuard(
      umi,
      candyMachine.mintAuthority
    );

    try {
      // Mint from the Candy Machine.
      const nftMint = generateSigner(umi);
      const transaction = transactionBuilder()
        .add(setComputeUnitLimit(umi, { units: 800_000 }))
        .add(
          route(umi, {
            guard: "allowList",
            candyMachine: candyMachine.publicKey,
            candyGuard: candyGuard?.publicKey,
            routeArgs: {
              path: "proof",
              merkleRoot: getMerkleRoot(allowList),
              merkleProof: getMerkleProof(allowList, publicKey(umi.identity)),
            },
          })
        )
        .add(
          mintV2(umi, {
            candyMachine: candyMachine.publicKey,
            candyGuard: candyGuard?.publicKey,
            nftMint,
            collectionMint: candyMachine.collectionMint,
            collectionUpdateAuthority: candyMachine.authority,
            mintArgs: {
              solPayment: some({ destination: treasury }),
              allowList: some({ merkleRoot: getMerkleRoot(allowList) }),
            },
          })
        );
      const { signature } = await transaction.sendAndConfirm(umi, {
        confirm: { commitment: "confirmed" },
      });
      const txid = bs58.encode(signature);
      console.log("success", `Mint successful! ${txid}`);
      notify({ type: "success", message: "Mint successful!", txid });

      getUserSOLBalance(wallet.adapter.publicKey, connection);
    } catch (error: any) {
      notify({
        type: "error",
        message: `Error minting!`,
        description: error?.message,
      });
      console.log("error", `Mint failed! ${error?.message}`);
    }
  }, [wallet, connection, getUserSOLBalance, umi]);

  return (
    <div className="flex flex-row justify-center">
      <div className="relative group items-center">
        <div
          className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                    rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"
        ></div>
        <button
          className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
          onClick={onClick}
        >
          <span>Mint NFT </span>
        </button>
      </div>
    </div>
  );
};
