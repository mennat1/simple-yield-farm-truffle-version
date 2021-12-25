var chai = require('chai');  
const { solidity } = require("ethereum-waffle");
chai.use(solidity);
const { expect } = chai;
const { time } = require("@openzeppelin/test-helpers");


var Escrow = artifacts.require("Escrow");
var FluxToken = artifacts.require("FluxToken");
var MockDAI = artifacts.require("MockERC20");

contract("Escrow", (accounts) => {
  let escrow, mockDAI, fluxToken;
  const acc0 = accounts[0];
  const acc1 = accounts[1];
  const acc2 = accounts[2];
  const acc3 = accounts[3];

  const daiAmount = 100;
  
  before(async() => {

    mockDAI = await MockDAI.new("MockDAI", "MDAI");
    console.log("mockDAI.address", mockDAI.address);
  
    fluxToken = await FluxToken.new();
    console.log("fluxToken.address", fluxToken.address);
  
    escrow = await Escrow.new(mockDAI.address, fluxToken.address);
    console.log("escrow.address", escrow.address);

      
    await mockDAI.mint(acc0, daiAmount);
    await mockDAI.mint(acc1, daiAmount);
    await mockDAI.mint(acc2, daiAmount);
    await mockDAI.mint(acc3, daiAmount);

    console.log("acc0 = ", acc0);
    console.log("acc1 = ", acc1);
    console.log("acc2 = ", acc2);
    console.log("acc2 = ", acc3);
    
  
  });

  it("should deploy contracts", async() => {
    expect(escrow).to.be.ok
    expect(fluxToken).to.be.ok
    expect(mockDAI).to.be.ok
  })

  it("should return name", async() => {
      expect(await mockDAI.name()).to.eq("MockDAI")
      expect(await fluxToken.name()).to.eq("FluxToken")
      expect(await escrow.name()).to.eq("Flux Farm")


  })

  it("should mint mockDAI to acc0, acc1, acc2", async() => {
    console.log("daiAmount = ", daiAmount)
    expect(Number(await mockDAI.balanceOf(acc0))).to.eq(Number(web3.utils.toWei(String(daiAmount))));

    expect(Number(await mockDAI.balanceOf(acc1))).to.eq(Number(web3.utils.toWei(String(daiAmount))));

    expect(Number(await mockDAI.balanceOf(acc2))).to.eq(Number(web3.utils.toWei(String(daiAmount))));
  });

  it("should stake DAI tokens", async() => {
    let stakeAmount = 10
    console.log("stakeAmount = ", (stakeAmount))
    await mockDAI.approve(escrow.address, web3.utils.toWei("10"), {from:acc0});

    let daiBalanceBeforeStaking = await mockDAI.balanceOf(acc0)
    console.log("daiBalanceBeforeStaking = ", web3.utils.fromWei(daiBalanceBeforeStaking))
    expect(await escrow.isStaking(acc0)).to.eq(false)
    
    expect(await escrow.stake(web3.utils.toWei(String(stakeAmount)), {from:acc0})).to.be.ok

    let daiBalanceAfterStaking = await mockDAI.balanceOf(acc0)
    console.log("daiBalanceAfterStaking = ", web3.utils.fromWei(daiBalanceAfterStaking))


    expect(Number(daiBalanceBeforeStaking))
        .to.eq(Number(daiBalanceAfterStaking) + Number(web3.utils.toWei(String(stakeAmount))))

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
    await mockDAI.approve(escrow.address, web3.utils.toWei("10"), {from:acc1});
    await escrow.stake(web3.utils.toWei("10"), {from:acc1})
    // Fast-forward time for 1 day
    await time.increase(86400) // 1 day forward
    expect(Number(await escrow.calculateStakingTimeInSeconds(acc1))).to.be.approximately(86400, 1)
  })

  it("should mint correct token amount when staker withdraws yield", async() => { 
    console.log("Fast forward 2 Days")
    await time.increase(86400) // 1 more day forward
    let secondsStaked = Number(await escrow.calculateStakingTimeInSeconds(acc0))
    await escrow.withdrawYield()
    let daysStaked = secondsStaked / 86400
    let daysStakedFormatted = secondsStaked * (10**18) / 86400 // Staked for how many days?
    let daiStaked = await escrow.stakingBalance(acc0)
    // await escrow.withdrawYield()
    console.log(`secondsStaked= ${secondsStaked}, daysStaked= ${daysStaked}, daiStaked= ${web3.utils.fromWei(daiStaked)}`)
    expectedYield = (daiStaked * daysStakedFormatted) / (10**18) // in miniDAI
    console.log("expected yield = ", expectedYield)
    
    fluxTokenTotalSupply = await fluxToken.totalSupply()    
    console.log("fluxTokenTotalSupply = ", BigInt(fluxTokenTotalSupply))
    let fluxTokenBalance = await fluxToken.balanceOf(acc0);
    console.log("acc0 fluxTokenBalance = ", BigInt(fluxTokenBalance));

    fluxTokenTotalSupply = Number.parseFloat(Number(web3.utils.fromWei(fluxTokenTotalSupply))).toFixed(2).toString()
    expectedYield =  Number.parseFloat(Number(web3.utils.fromWei(String(expectedYield)))).toFixed(2).toString()
    console.log("formatted fluxTokenTotalSupply = ", fluxTokenTotalSupply)
    console.log("formatted expected yield = ", expectedYield)
    expect(Number(fluxTokenTotalSupply)).to.be.approximately(20, 0.001)
    expect(Number(expectedYield)).to.be.approximately(20, 0.001)
    expect(Number(expectedYield)).to.eq(Number(fluxTokenTotalSupply))

  })

  it("should update yield balance when unstaked", async() => {
    

    await mockDAI.approve(escrow.address, web3.utils.toWei("10"), {from:acc2});
    await escrow.stake(web3.utils.toWei("10"), {from:acc2})
    // Fast-forward time
    await time.increase(86400) // 1 day forward
    await escrow.unstake(web3.utils.toWei("10"), {from:acc2})
    let fluxTokenBalance = await escrow.fluxTokenBalance(acc2)
    let daiTokenBalance = await mockDAI.balanceOf(acc2)
    let stakingBalance = await escrow.stakingBalance(acc2)
    console.log("fluxTokenBalance = ", Number(web3.utils.fromWei(fluxTokenBalance)))
    console.log("daiTokenBalance = ", Number(web3.utils.fromWei(daiTokenBalance)))
    console.log("stakingBalance = ", Number(web3.utils.fromWei(stakingBalance)))
    expect(Number(web3.utils.fromWei(fluxTokenBalance))).to.be.approximately(10, 0.001)
    expect(Number(web3.utils.fromWei(daiTokenBalance))).to.eq(100)
    expect(Number(web3.utils.fromWei(stakingBalance))).to.eq(0)
    expect(await escrow.isStaking(acc2)).to.eq(false)

  })

  it("should return correct yield when partially unstake", async() => {
    await mockDAI.approve(escrow.address, web3.utils.toWei("10"), {from:acc3});
    console.log("++++++++++++++++ After staking 10 DAI for 1 day")
    await escrow.stake(web3.utils.toWei("10"), {from:acc3})
    await time.increase(86400) 
    let fluxTokenBalance = await escrow.fluxTokenBalance(acc3)
    let daiTokenBalance = await mockDAI.balanceOf(acc3)
    let stakingBalance = await escrow.stakingBalance(acc3)
    console.log("escrow.fluxTokenBalance = ", Number(web3.utils.fromWei(fluxTokenBalance))) // 0
    console.log("fluxToken.balanceOf(acc3) = ", Number(web3.utils.fromWei(await fluxToken.balanceOf(acc3)))) // 0

    console.log("daiTokenBalance = ", Number(web3.utils.fromWei(daiTokenBalance))) // 90
    console.log("stakingBalance = ", Number(web3.utils.fromWei(stakingBalance))) // 10

    console.log("++++++++++++++++ Right after partially unstaking 5 DAI") // acc3 gets back 5 DAI, but he needs to withdraw yield to get fluxTokens
    await escrow.unstake(web3.utils.toWei("5"), {from:acc3})

    fluxTokenBalance = await escrow.fluxTokenBalance(acc3)
    daiTokenBalance = await mockDAI.balanceOf(acc3)
    stakingBalance = await escrow.stakingBalance(acc3)
    console.log("escrow.fluxTokenBalance = ", Number(web3.utils.fromWei(fluxTokenBalance))) // 10
    console.log("fluxToken.balanceOf(acc3) = ", Number(web3.utils.fromWei(await fluxToken.balanceOf(acc3)))) // 0

    console.log("daiTokenBalance = ", Number(web3.utils.fromWei(daiTokenBalance))) // 95
    console.log("stakingBalance = ", Number(web3.utils.fromWei(stakingBalance))) // 5

    expect(Number(web3.utils.fromWei(fluxTokenBalance))).to.be.approximately(10,0.001)
    expect(Number(web3.utils.fromWei(await fluxToken.balanceOf(acc3)))).to.eq(0)
    expect(Number(web3.utils.fromWei(daiTokenBalance))).to.eq(95)
    expect(Number(web3.utils.fromWei(stakingBalance))).to.eq(5)


    await time.increase(86400)
    console.log("++++++++++++++++ After withdrawing yield of staking 5 DAI for 1 day")
    await escrow.withdrawYield({from:acc3})

    fluxTokenBalance = await escrow.fluxTokenBalance(acc3)
    daiTokenBalance = await mockDAI.balanceOf(acc3)
    stakingBalance = await escrow.stakingBalance(acc3)
    console.log("escrow.fluxTokenBalance = ", Number(web3.utils.fromWei(fluxTokenBalance))) // 0
    console.log("fluxToken.balanceOf(acc3) = ", Number(web3.utils.fromWei(await fluxToken.balanceOf(acc3)))) // 15

    console.log("daiTokenBalance = ", Number(web3.utils.fromWei(daiTokenBalance))) // 95
    console.log("stakingBalance = ", Number(web3.utils.fromWei(stakingBalance))) // 5


    expect(Number(web3.utils.fromWei(fluxTokenBalance))).to.eq(0)
    expect(Number(web3.utils.fromWei(await fluxToken.balanceOf(acc3)))).to.be.approximately(15, 0.001)
    expect(Number(web3.utils.fromWei(daiTokenBalance))).to.eq(95)
    expect(Number(web3.utils.fromWei(stakingBalance))).to.eq(5)


  })

  //  Unstake
  it("should unstake balance from user", async() => {
    let stakingBalance = await escrow.stakingBalance(acc0)
    console.log("staking balance = ", Number(web3.utils.fromWei(stakingBalance)))
    expect(Number(stakingBalance)).to.be.greaterThan(0)
    let daiBalanceBeforeUnStaking = await mockDAI.balanceOf(acc0)
    console.log("daiBalanceBeforeUnStaking = ", web3.utils.fromWei(daiBalanceBeforeUnStaking))

    let amountToUnstake = web3.utils.toWei("10")
    await escrow.unstake(amountToUnstake, {from:acc0})

    let daiBalanceAfterUnStaking = await mockDAI.balanceOf(acc0)
    console.log("daiBalanceAfterUnStaking = ", web3.utils.fromWei(daiBalanceAfterUnStaking))
    expect(Number(daiBalanceAfterUnStaking))
        .to.eq(Number(daiBalanceBeforeUnStaking) + Number((amountToUnstake)))
    
    stakingBalance = await escrow.stakingBalance(acc0)
    expect(Number(stakingBalance)).to.eq(0);

    expect(await escrow.isStaking(acc0)).to.eq(false)
  })



});

