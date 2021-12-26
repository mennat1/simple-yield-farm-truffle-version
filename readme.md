# A simple yield farm exchange that lets users stake ERC20/DAI tokens and accrue interest of ERC20 tokens:

- This smart contract lets you stake ERC20 tokens (DAI) and accrue interest of ERC20 tokens (flux tokens).
  
## Workflow:
- Stake Tokens
- Accrue interest of 1 DAI for each staked ERC20 token for each day staked
- withdraw yield to receive accrued interest
- unstake tokens to recieve back your staked DAI



## Directory structure:
- contracts: Smart contracts that are deployed in Rinkeby testnet:
  1) Escrow.sol : farming smart contract.
  2) FluxTokens.sol : reward/ineterest ERC20 tokens.
  3) MockERC20.sol: to mock DAI tokens.
- migrations: Migration files for deploying contracts in contracts directory.
- test: Tests for smart contracts.


## How to run this project locally:
### Prerequisites:
- Node.js >= v14
- Truffle and Ganache-cli
- Npm

### Tests:
- Run (sudo) npm install in project root to install dependencies.
- First Test (contracts.test.js):
  1) Make sure Ganache-cli is running using: $ganache-cli.(port 8575).
  2) Run test using: $truffle test test/contracts.test.js
- Second Test (mainnetFork.test.js):
  1) Create a mainnet node on Alchemy and place the API key in the .env file
  2) Fetch DAI token address from etherscan mainnet and place it in the .env file (it's already there in the .env.example file tho)
  3) Fetch DAI Whales addresses and place them in the .env file and make sure they have enough eth to make txs (you'll find whales addresses in the .env.example file as well)
  4) Run ($source .env) in the root directory to use those vars
  5) In one terminal run: \
        $ ganache-cli --fork https://eth-mainnet.alchemyapi.io/v2/$ALCHEMY_KEY /\
        --networkId 999 --unlock $DAI_WHALE1_ADDRESS --unlock $DAI_WHALE2_ADDRESS /\
        --unlock $DAI_WHALE3_ADDRESS --unlock $DAI_WHALE4_ADDRESS
  6) In another terminal run: \
        $truffle test test/mainnetFork.test.js --network mainnet_fork
  7) You can also run contracts.test.js on the mainnet fork.
  




