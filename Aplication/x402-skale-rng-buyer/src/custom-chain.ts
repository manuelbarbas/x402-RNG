// Note that this should satisfy the `Chain` type from viem, but due to Typescript type-safety being super strange cross version; the recommended approach is to use the `any` type to avoid issues.
export const skaleBaseSepoliaTestnetV1: any = {
  id: 324705682,
  name: "SKALE Base Sepolia Testnet",
  rpcUrls: {
    default: {
      http: ["https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha"]
    }
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://base-sepolia-testnet-explorer.skalenodes.com/"
    }
  },
  nativeCurrency: {
    name: "Credits",
    decimals: 18,
    symbol: "CRED"
  }
};