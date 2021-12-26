var Escrow = artifacts.require("./Escrow.sol");
var FluxToken = artifacts.require("./FluxToken.sol");
var MockDAI = artifacts.require("MockERC20.sol");

module.exports = async function(deployer) {

  await deployer.deploy(MockDAI, "MockDAI", "MDAI");
  const mockDAI = await MockDAI.deployed();
  // console.log("mockDAI.address", mockDAI.address);

  await deployer.deploy(FluxToken);
  const fluxToken = await FluxToken.deployed();
  // console.log("fluxToken.address", fluxToken.address);

  await deployer.deploy(Escrow, mockDAI.address, fluxToken.address);
  const escrow = await Escrow.deployed();
  // console.log("escrow.address", escrow.address);

  

  


};
