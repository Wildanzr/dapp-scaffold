import idl from "../idl/spl_standard.json";

import { PublicKey } from "@solana/web3.js";

export const allowList = [
  "DAnZrjXjRd5GoQgPSzNxV7igAkELyGznppY8Lyki4ugr",
  "9TQmfmwhTvP5XgsU17S6wnczwXYvBD6wVS6vb9HdAnZr",
];

export const tokenAddress = new PublicKey(
  "5F9uUFDEbp5AZWsrko8N9Ft22WutSj4bX9ow1xuYSrSY"
);

export const tokenProgramId = new PublicKey(idl.metadata.address);
export const tokenProgramInterface = JSON.parse(JSON.stringify(idl));
export const commitmentLevel = "processed";

export const programId = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

export const TOKEN_ACCOUNT_OWNER_PDA = "token_account_owner_pda";
export const TOKEN_VAULT = "token_vault";