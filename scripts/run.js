const main = async () =>{
	const [owner, userA] = await hre.ethers.getSigners()
	const domainContractFactory = await hre.ethers.getContractFactory('Domains')
	const domainContract = await domainContractFactory.deploy("melon")
	await domainContract.deployed()

	console.log("Contract deployed to: ", domainContract.address)
	console.log("Contract deployed by: ", owner.address)

	let txn = await domainContract.register("MJL", {value: hre.ethers.utils.parseEther('1')})
	await txn.wait()

	let address = await domainContract.getAddress("MJL")
	console.log("Owner of domain MJL: ", address)

	let balance = await hre.ethers.provider.getBalance(domainContract.address)
	console.log("Contract balance:", hre.ethers.utils.formatEther(balance))

// ----------
	// await domainContract.connect(userA).register("JK", {value: hre.ethers.utils.parseEther('0.1')})
	// address = await domainContract.getAddress("JK")
	// console.log("Owner of domain JK: ", address)

	// balance = await hre.ethers.provider.getBalance(domainContract.address)
	// console.log("Contract balance2:", hre.ethers.utils.formatEther(balance))
	
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