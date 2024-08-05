import type { NextPage } from "next";
import Head from "next/head";
import { TokenView } from "../views";

const Token: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Solana Scaffold</title>
        <meta name="description" content="Solana Scaffold" />
      </Head>
      <TokenView />
    </div>
  );
};

export default Token;
