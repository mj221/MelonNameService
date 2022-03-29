require("@nomiclabs/hardhat-waffle");
// require("hardhat-gas-reporter");
require('babel-register');
require('babel-polyfill');
require("dotenv").config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const privateKey = process.env.PRIVATE_KEY || "";
const privateKeyArray = privateKey.split(',')
const ProjectId = process.env.PROJECT_ID;
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.10",
  settings: {
    optimizer: {
        enabled: true,
        runs: 1000000,
    },
  },
  mocha: {
    timeout: 100000
  },
  paths:{
    artifacts: "./domain-melon/src/build",
    tests: "./test"
  },
  // gasReporter: {
  //   enabled: (process.env.REPORT_GAS) ? true : false
  // },
  networks:{
    // ganache: {
    //   url: "http://127.0.0.1:8545",
    //   accounts: [""]
    // },
    hardhat:{
      chainId: 1337,
      gas: "auto",
      gasPrice: "auto",
      blockGasLimit: 100000000429720,
    },
    mumbai:{
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ProjectId}`,
      accounts: privateKeyArray
    }
    // rinkeby:{
    //   url: `https://rinkeby.infura.io/v3/${infuraProjectId}`,
    //   accounts: privateKeyArray,
    // }
  }
};
