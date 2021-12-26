const path = require("path");

require('dotenv').config()
const { ALCHEMY_KEY } = process.env;



module.exports = {
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),

  networks: {
  
    development: {
      
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
      networkCheckTimeout: 999999
    },

    mainnet_fork: {
      // url:`https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Standard Ethereum port (default: none)
      network_id: "999",       // Any network (default: none)
    }
  
    
  },

  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    
    solc: {
      version: "0.8.3",    // Fetch exact version from solc-bin (default: truffle's version)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
       optimizer: {
         enabled: false,
         runs: 200
       },
      //  evmVersion: "byzantium"
      }
    }
  },

  plugins: [
    "@neos1/truffle-plugin-docs"
  ]


};
