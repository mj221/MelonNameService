const main = async () =>{
	const domainContractFactory = await hre.ethers.getContractFactory('Domains')
	const domainContract = await domainContractFactory.deploy("melon")
	await domainContract.deployed()

	console.log("Contract deployed to: ", domainContract.address)

	let txn = await domainContract.register("diamond", {value: hre.ethers.utils.parseEther('0.1'), gasLimit: '10429720'})
	await txn.wait()

	console.log("Minted domain diamond.melon")

	txn = await domainContract.setRecord("diamond", "A diamond handed melon")
	await txn.wait()
	const address = await domainContract.getAddress("diamond")
	console.log("Owner of domain diamond: ", address)

	const balance = await hre.ethers.provider.getBalance(domainContract.address)
	console.log("Contract balance:", hre.ethers.utils.formatEther(balance))
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