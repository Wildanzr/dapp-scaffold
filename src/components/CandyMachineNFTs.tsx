import { useConnection } from "@solana/wallet-adapter-react";
import { FC, useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";
import { Button, HStack, Text, Image } from "@chakra-ui/react";

const CandyMachineNFTs: FC = () => {
  const { connection } = useConnection();

  // const [candyMachineAddress, setCandyMachineAddress] = useState("");
  const [candyMachineData, setCandyMachineData]: any = useState(null);
  const [pageItems, setPageItems]: any = useState(null);
  const [page, setPage] = useState(1);
  const metaplex = Metaplex.make(connection);

  const fetchCandyMachine = async () => {
    setPage(1);

    try {
      const candyMachine = await metaplex.candyMachines().findByAddress({
        address: new PublicKey(
          process.env.NEXT_PUBLIC_CANDY_MACHINE_ID as string
        ),
      });

      setCandyMachineData(candyMachine);
    } catch (e) {
      alert("Please submit a valid CMv2 address.");
    }
  };

  const getPage = async (page: number, perPage: number) => {
    const pageItems = candyMachineData.items
      .filter((item) => item.minted === true)
      .slice((page - 1) * perPage, page * perPage);

    // fetch metadata of NFTs for page
    let nftData = [];
    for (let i = 0; i < pageItems.length; i++) {
      let fetchResult = await fetch(pageItems[i].uri);
      let json = await fetchResult.json();
      nftData.push(json);
    }

    // set state
    console.log(nftData);
    setPageItems(nftData);
  };

  const prev = async () => {
    if (page - 1 < 1) {
      setPage(1);
    } else {
      setPage(page - 1);
    }
  };

  // next page
  const next = async () => {
    setPage(page + 1);
  };

  useEffect(() => {
    fetchCandyMachine();
  }, []);

  // fetch metadata for NFTs when page or candy machine changes
  useEffect(() => {
    if (!candyMachineData) {
      return;
    }
    getPage(page, 3);
  }, [candyMachineData, page]);

  return (
    <>
      <HStack spacing={10}>
        {pageItems &&
          pageItems.map((nft: any, index: number) => (
            <Image key={index} src={nft.image} alt={nft.name} height="300" />
          ))}
      </HStack>
      <HStack spacing={5}>
        {page > 1 && (
          <Button
            borderRadius={10}
            paddingX={20}
            paddingY={12}
            bgColor="white"
            color="black"
            maxW="380px"
            onClick={prev}
          >
            <Text>Prev</Text>
          </Button>
        )}

        {page < 3 && (
          <Button
            borderRadius={10}
            paddingX={20}
            paddingY={12}
            bgColor="white"
            color="black"
            maxW="380px"
            onClick={next}
          >
            <Text>Next</Text>
          </Button>
        )}
      </HStack>
    </>
  );
};

export default CandyMachineNFTs;
