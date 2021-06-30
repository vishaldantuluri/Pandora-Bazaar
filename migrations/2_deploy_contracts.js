const ipfsHash = artifacts.require("ipfsHash");
const myToken = artifacts.require("myToken");

module.exports = function(deployer) {
  deployer.deploy(ipfsHash);
  deployer.deploy(myToken);
};