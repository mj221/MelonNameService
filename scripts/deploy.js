
const fs = require('fs');

const main = async () =>{
	const domainContractFactory = await hre.ethers.getContractFactory('Domains')
	const domainContract = await domainContractFactory.deploy("melon")
	await domainContract.deployed()

	console.log("Contract deployed to: ", domainContract.address)
	saveFrontendFiles(domainContract.address)
	// let path = "QmWcXxJXsdD94msN5L6iu8YeEzhcKvDJap82tmRrppaw7Z"
	// let ipfspath = `ipfs://${path}`

	// let txn = await domainContract.register("github", ipfspath, {value: hre.ethers.utils.parseEther('0.1'), gasLimit: '10429720'})
	// await txn.wait()

	// console.log("Minted domain github.melon")

	// txn = await domainContract.setRecord("github", "A github melon")
	// await txn.wait()
	// const address = await domainContract.getAddress("github")
	// console.log("Owner of domain github: ", address)

	// const balance = await hre.ethers.provider.getBalance(domainContract.address)
	// console.log("Contract balance:", hre.ethers.utils.formatEther(balance))
}

async function saveFrontendFiles(tokenAddr) {
  const contractsDir = __dirname + "/../domain-melon/src/build/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + "/contract-address.json",
    JSON.stringify(
      {
        MNSContractAddress: tokenAddr
      }
    )
  );

}

const runMain = async () =>{
	try{
		await main()
		process.exit(0)
	}catch(error){
		console.log(error)
		process.exit(1)
	}
}

runMain()