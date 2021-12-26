//$ganache-cli --fork https://eth-mainnet.alchemyapi.io/v2/$ALCHEMY_KEY \
//--networkId 999 --unlock $DAI_WHALE1_ADDRESS --unlock $DAI_WHALE2_ADDRESS \
// --unlock $DAI_WHALE3_ADDRESS --unlock $DAI_WHALE4_ADDRESS
// $truffle test test/mainnetFork.test.js --network mainnet_fork


var chai = require('chai');  
const { solidity } = require("ethereum-waffle");
chai.use(solidity);
const { expect } = chai;
const { time } = require("@openzeppelin/test-helpers");
require('dotenv').config()
const IERC20 = artifacts.require("IERC20");

const { DAI_ADDRESS,  DAI_WHALE1_ADDRESS, DAI_WHALE2_ADDRESS, DAI_WHALE3_ADDRESS, DAI_WHALE4_ADDRESS} = process.env;

var Escrow = artifacts.require("Escrow");
var FluxToken = artifacts.require("FluxToken");

contract("Escrow", (accounts) => {
  let escrow, daiTokenContract, fluxToken, stakeAmount

 
  const acc0 = DAI_WHALE1_ADDRESS;
  const acc1 = DAI_WHALE2_ADDRESS;
  const acc2 = DAI_WHALE3_ADDRESS;
  const acc3 = DAI_WHALE4_ADDRESS;

  
  before(async() => {

    daiTokenContract = new web3.eth.Contract(
      IERC20.abi,
      DAI_ADDRESS
    );
    // console.log(IERC20.abi)
    console.log("daiTokenContract", DAI_ADDRESS);
  
    fluxToken = await FluxToken.new();
    console.log("fluxToken.address", fluxToken.address);
  
    escrow = await Escrow.new(DAI_ADDRESS, fluxToken.address);
    console.log("escrow.address", escrow.address);

   

    console.log("acc0 = ", acc0);
    console.log("acc1 = ", acc1);
    console.log("acc2 = ", acc2);
    console.log("acc2 = ", acc3);
    
  
  });

  it("should deploy contracts", async() => {
    expect(escrow).to.be.ok
    expect(fluxToken).to.be.ok
    expect(daiTokenContract).to.be.ok
  })

  it("should return name", async() => {
      // expect(await daiTokenContract.methods.name()).to.eq("MockDAI")
      expect(await fluxToken.name()).to.eq("FluxToken")
      expect(await escrow.name()).to.eq("Flux Farm")


  })

  
  it("should stake DAI tokens", async() => {
    stakeAmount = 1000
    console.log("stakeAmount = ", (stakeAmount))
    await daiTokenContract.methods.approve(escrow.address, web3.utils.toWei(String(stakeAmount))).send({from:acc0});

    let daiBalanceBeforeStaking = await daiTokenContract.methods.balanceOf(acc0).call()
    console.log("daiBalanceBeforeStaking = ", web3.utils.fromWei(daiBalanceBeforeStaking))
    expect(await escrow.isStaking(acc0)).to.eq(false)
    
    expect(await escrow.stake(web3.utils.toWei(String(stakeAmount)), {from:acc0})).to.be.ok

    let daiBalanceAfterStaking = await daiTokenContract.methods.balanceOf(acc0).call()
    console.log("daiBalanceAfterStaking = ", web3.utils.fromWei(daiBalanceAfterStaking))

    expect(Number(daiBalanceBeforeStaking))
        .to.eq(Number(BigInt(daiBalanceAfterStaking) + BigInt(web3.utils.toWei(String(stakeAmount)))))

    expect(Number(await escrow.stakingBalance(acc0))).to.eq(Number(web3.utils.toWei(String(stakeAmount))))
    
    expect(await escrow.isStaking(acc0)).to.eq(true)
  })

  it("should revert stake of zero value", async() => {
    await expect(escrow.stake(0)).to.be.revertedWith("You cannot stake zero tokens")
  })

  it("should revert stake if there's no enough DAI token balance", async() => {
    let stakeAmount = web3.utils.toWei("150")
    await expect(escrow.stake(stakeAmount)).to.be.revertedWith("stake amount exceeds balance")
  })

 
 
  it("should transfer ownership", async() => {
    let minter = await fluxToken.MINTER_ROLE()
    let defaultAdminRole = await fluxToken.DEFAULT_ADMIN_ROLE()
    console.log("escrow has fluxToken minter role", await fluxToken.hasRole(minter, escrow.address))
    console.log("acc0 has fluxToken defaultAdminRole role", await fluxToken.hasRole(defaultAdminRole, acc0))
    await fluxToken.grantRole(minter, escrow.address)
    expect(await fluxToken.hasRole(minter, escrow.address)).to.eq(true)
    console.log("escrow has fluxToken minter role", await fluxToken.hasRole(minter, escrow.address))
  });

  it("should return correct yield time", async() => {
    await daiTokenContract.methods.approve(escrow.address, web3.utils.toWei("10")).send({from:acc1});
    await escrow.stake(web3.utils.toWei("10"), {from:acc1})
    // Fast-forward time for 1 day
    await time.increase(86400) // 1 day forward
    expect(Number(await escrow.calculateStakingTimeInSeconds(acc1))).to.be.approximately(86400, 1)
  })

  it("should mint correct token amount when staker withdraws yield", async() => { 
    console.log("Fast forward 2 Days")
    await time.increase(86400) // 1 more day forward
    let secondsStaked = Number(await escrow.calculateStakingTimeInSeconds(acc0))
    await escrow.withdrawYield({from:acc0})
    let daysStaked = secondsStaked / 86400
    let daysStakedFormatted = secondsStaked/ 86400 // Staked for how many days?
    let daiStaked = await escrow.stakingBalance(acc0)
    // await escrow.withdrawYield()
    console.log(`secondsStaked= ${secondsStaked}, daysStaked= ${daysStaked}, daiStaked= ${web3.utils.fromWei(daiStaked)}`)
    expectedYield = BigInt(daiStaked * daysStakedFormatted)// in miniDAI
    console.log("expected yield = ", expectedYield)
    
    fluxTokenTotalSupply = await fluxToken.totalSupply()    
    console.log("fluxTokenTotalSupply = ", BigInt(fluxTokenTotalSupply))
    let fluxTokenBalance = await fluxToken.balanceOf(acc0);
    console.log("acc0 fluxTokenBalance = ", BigInt(fluxTokenBalance));

    // fluxTokenTotalSupply = web3.utils.fromWei(web3.utils.toBN(fluxTokenTotalSupply));
    // expectedYield = web3.utils.fromWei(web3.utils.toBN(expectedYield));
    fluxTokenTotalSupply = Number.parseFloat(Number(web3.utils.fromWei(String(fluxTokenTotalSupply)))).toFixed(1).toString()
    expectedYield =  Number.parseFloat(Number(web3.utils.fromWei(String(expectedYield)))).toFixed(1).toString()
    console.log("formatted fluxTokenTotalSupply = ", fluxTokenTotalSupply)
    console.log("formatted expected yield = ", expectedYield)
    expect(Number(fluxTokenTotalSupply)).to.be.approximately(2*stakeAmount, 0.1)
    expect(Number(expectedYield)).to.be.approximately(2*stakeAmount, 0.1)
    expect(Number(expectedYield)).to.be.approximately(Number(fluxTokenTotalSupply), 0.1)

  })

  it("should update yield balance when unstaked", async() => {
    

    await daiTokenContract.methods.approve(escrow.address, web3.utils.toWei("10")).send({from:acc2});
    await escrow.stake(web3.utils.toWei("10"), {from:acc2})
    // Fast-forward time
    await time.increase(86400) // 1 day forward
    await escrow.unstake(web3.utils.toWei("10"), {from:acc2})
    let fluxTokenBalance = await escrow.fluxTokenBalance(acc2)
    let daiTokenBalance = await daiTokenContract.methods.balanceOf(acc2).call()
    let stakingBalance = await escrow.stakingBalance(acc2)
    console.log("escrow.fluxTokenBalance = ", Number(web3.utils.fromWei(fluxTokenBalance)))
    console.log("daiTokenBalance = ", Number(web3.utils.fromWei(daiTokenBalance)))
    console.log("stakingBalance = ", Number(web3.utils.fromWei(stakingBalance)))
    expect(Number(web3.utils.fromWei(fluxTokenBalance))).to.be.approximately(10, 0.001)
    expect(Number(web3.utils.fromWei(stakingBalance))).to.eq(0)
    expect(await escrow.isStaking(acc2)).to.eq(false)

  })

  it("should return correct yield when partially unstake", async() => {
    await daiTokenContract.methods.approve(escrow.address, web3.utils.toWei("10")).send({from:acc3});
    console.log("++++++++++++++++ After staking 10 DAI for 1 day")
    await escrow.stake(web3.utils.toWei("10"), {from:acc3})
    await time.increase(86400) 
    let fluxTokenBalance = await escrow.fluxTokenBalance(acc3)
    let daiTokenBalance = await daiTokenContract.methods.balanceOf(acc3).call()
    let stakingBalance = await escrow.stakingBalance(acc3)
    console.log("escrow.fluxTokenBalance = ", Number(web3.utils.fromWei(fluxTokenBalance))) // 0
    console.log("fluxToken.balanceOf(acc3) = ", Number(web3.utils.fromWei(await fluxToken.balanceOf(acc3)))) // 0

    console.log("daiTokenBalance = ", Number(web3.utils.fromWei(daiTokenBalance))) 
    console.log("stakingBalance = ", Number(web3.utils.fromWei(stakingBalance))) // 10

    console.log("++++++++++++++++ Right after partially unstaking 5 DAI") // acc3 gets back 5 DAI, but he needs to withdraw yield to get fluxTokens
    await escrow.unstake(web3.utils.toWei("5"), {from:acc3})

    fluxTokenBalance = await escrow.fluxTokenBalance(acc3)
    stakingBalance = await escrow.stakingBalance(acc3)
    console.log("escrow.fluxTokenBalance = ", Number(web3.utils.fromWei(fluxTokenBalance))) // 10
    console.log("fluxToken.balanceOf(acc3) = ", Number(web3.utils.fromWei(await fluxToken.balanceOf(acc3)))) // 0

    console.log("stakingBalance = ", Number(web3.utils.fromWei(stakingBalance))) // 5

    expect(Number(web3.utils.fromWei(fluxTokenBalance))).to.be.approximately(10,0.001)
    expect(Number(web3.utils.fromWei(await fluxToken.balanceOf(acc3)))).to.eq(0)
    expect(Number(web3.utils.fromWei(stakingBalance))).to.eq(5)


    await time.increase(86400)
    console.log("++++++++++++++++ After withdrawing yield of staking 5 DAI for 1 day")
    await escrow.withdrawYield({from:acc3})

    fluxTokenBalance = await escrow.fluxTokenBalance(acc3)
    daiTokenBalance = await daiTokenContract.methods.balanceOf(acc3).call()
    stakingBalance = await escrow.stakingBalance(acc3)
    console.log("escrow.fluxTokenBalance = ", Number(web3.utils.fromWei(fluxTokenBalance))) // 0
    console.log("fluxToken.balanceOf(acc3) = ", Number(web3.utils.fromWei(await fluxToken.balanceOf(acc3)))) // 15

    console.log("daiTokenBalance = ", Number(web3.utils.fromWei(daiTokenBalance))) // 95
    console.log("stakingBalance = ", Number(web3.utils.fromWei(stakingBalance))) // 5


    expect(Number(web3.utils.fromWei(fluxTokenBalance))).to.eq(0)
    expect(Number(web3.utils.fromWei(await fluxToken.balanceOf(acc3)))).to.be.approximately(15, 0.001)
    expect(Number(web3.utils.fromWei(stakingBalance))).to.eq(5)


  })

  // //  Unstake
  it("should unstake balance from user", async() => {
    let stakingBalance = await escrow.stakingBalance(acc0)
    console.log("staking balance = ", Number(web3.utils.fromWei(stakingBalance)))
    expect(Number(stakingBalance)).to.be.greaterThan(0)
    let daiBalanceBeforeUnStaking = await daiTokenContract.methods.balanceOf(acc0).call()
    console.log("daiBalanceBeforeUnStaking = ", web3.utils.fromWei(daiBalanceBeforeUnStaking))

    let amountToUnstake = web3.utils.toWei(String(stakeAmount))
    await escrow.unstake(amountToUnstake, {from:acc0})

    let daiBalanceAfterUnStaking = await daiTokenContract.methods.balanceOf(acc0).call()
    console.log("daiBalanceAfterUnStaking = ", web3.utils.fromWei(daiBalanceAfterUnStaking))
    expect(Number(daiBalanceAfterUnStaking))
        .to.eq(Number(BigInt(daiBalanceBeforeUnStaking) + BigInt((amountToUnstake))))
    
    stakingBalance = await escrow.stakingBalance(acc0)
    expect(Number(stakingBalance)).to.eq(0);

    expect(await escrow.isStaking(acc0)).to.eq(false)
  })



});

