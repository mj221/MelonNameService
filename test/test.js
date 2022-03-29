// const { expect } = require("chai")
// const {EVM_REVERT} = require('./helpers')

require("chai").use(require('chai-as-promised')).should()

describe("Domains", async function () {
  let domainContract, owner, userA, userB, users

  beforeEach(async () => {
    const domainContractFactory = await ethers.getContractFactory('Domains')
    domainContract = await domainContractFactory.deploy("melon");
    [owner, userA, userB, ...users] = await ethers.getSigners();
    await domainContract.deployed()
  })

  describe('Domains deployment', () =>{
    it("Get top level domain", async function () {
      let tld = await domainContract.tld()
      tld.should.equal("melon")
    })
  })
  
  describe('Domain registration', () =>{
    let txn
    let gas = "0.6"
    beforeEach(async()=>{
      txn = await domainContract.register("MJL", 
        {
          value: ethers.utils.parseEther(gas)
        })

    })
    it('Track registered domain', async ()=>{
      const address = await domainContract.getAddress("MJL")
      address.should.equal(owner.address)
    })

    it('Track balance of contract', async () =>{
      const balance = await ethers.provider.getBalance(domainContract.address)
      ethers.utils.formatEther(balance).should.equal(gas)
    })

    it('Revert already registered', async() =>{
      await domainContract.connect(userA).register("MJL", {value: ethers.utils.parseEther(gas)}).should.be.rejectedWith("AlreadyRegistered")
    })

    it('Revert invalid name', async() =>{
      await domainContract.connect(userA).register("MJL", {value: ethers.utils.parseEther(gas)}).should.be.rejected
    })

    it('Revert with unauthorised', async() =>{
      await domainContract.connect(userA).setRecord("MJL", "Test1").should.be.rejectedWith("Unauthorised")
    })

  })

  describe('User data', ()=>{
    let txn
    let gas = "3"
    beforeEach(async()=>{
      txn = await domainContract.connect(owner).register("MJL", 
        {
          value: ethers.utils.parseEther(gas)
        })
      txn = await domainContract.connect(userA).register("NMK", 
        {
          value: ethers.utils.parseEther(gas)
        })
    })
    it('get all user names', async ()=>{
      const [name1, name2] = await domainContract.getAllNames()
      name1.should.equal("MJL")
      name2.should.equal("NMK")
    })

  })

  describe('Withdraw', () => {
    let txn
    let gas = "0.3"
    beforeEach(async()=>{
      txn = await domainContract.register("MJ", 
        {
          value: ethers.utils.parseEther(gas),
          gasLimit: '10429720'
        })
    })
   
    it('success', async () =>{
      let userBalance, contractBalance, initialUserBalance, initialContractBalance

      initialContractBalance = await ethers.provider.getBalance(domainContract.address)
      initialUserBalance = await ethers.provider.getBalance(owner.address)
      // console.log("Contract has: ", ethers.utils.formatEther(initialContractBalance))
      // console.log("Owner initially has: ", ethers.utils.formatEther(initialUserBalance))
      // await domainContract.withdraw({from: owner})
      await domainContract.connect(owner).withdraw();
      
      contractBalance = await ethers.provider.getBalance(domainContract.address)
      userBalance = await ethers.provider.getBalance(owner.address)

      // console.log("Contract has: ", ethers.utils.formatEther(contractBalance))
      // console.log("Owner now has: ", ethers.utils.formatEther(userBalance))
      Math.floor(ethers.utils.formatEther(contractBalance)).should.equal(0)
      parseFloat(ethers.utils.formatEther(userBalance)).should.be.at.least(9999.98)
  
    })

    it('failure', async() =>{
      await domainContract.connect(userA).withdraw().should.be.rejected
    })
  })
    
  
})



