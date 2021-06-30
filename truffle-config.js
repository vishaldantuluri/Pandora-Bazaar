require('babel-register');
require('babel-polyfill');
const HDWalletProvider = require("@truffle/hdwallet-provider");
const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    kovan: {
      provider: () => {
        return new HDWalletProvider(mnemonic, "wss://kovan.infura.io/ws/v3/6b3f79427eb54a588292c9203ad47a65")
      },
      network_id: 42,
      gas: 5500000,        
      confirmations: 2,    
      timeoutBlocks: 200,  
      skipDryRun: true 
    },
    testnet: {
      provider: () => new HDWalletProvider(mnemonic, `wss://data-seed-prebsc-1-s1.binance.org:8545`),
      network_id: 97,
      confirmations: 10, 
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },
  contracts_directory: './src/contracts/',
  contracts_build_directory: './src/abis/',
  compilers: {
    solc: {
      version: "0.8.0",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}
