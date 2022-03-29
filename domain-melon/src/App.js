import React, {useEffect, useState} from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';

import githubLogo from './assets/github-logo.svg';
import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';

import { networks } from './utils/networks';
import { ethers } from "ethers";
import MNSContract from './build/contracts/Domains.sol/Domains.json';

import {Modal , Button} from 'react-bootstrap';

// Constants
const GITHUB_HANDLE = 'mj221';
const GITHUB_LINK = `https://github.com/${GITHUB_HANDLE}`;

// Adding domain
const tld = '.melon';
const CONTRACT_ADDRESS = "0xD1589025C2785508f6E2ff201b7523f9Ca5D67fB"

const App = () => {
  const [network, setNetwork] = useState('')

  const [currentAccount, setCurrentAccount] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isMintingDomain, setIsMintingDomain] = useState(false)
  const [isMintingRecord, setIsMintingRecord] = useState(false)
  const [mints, setMints] = useState([])
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  const [domain, setDomain] = useState('')
  const [record, setRecord] = useState('')

  const [openSeaLink, setopenSeaLink] = useState('')

  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  useEffect(() => {
    const { ethereum } = window

    checkIfWalletIsConnected()

    if (ethereum){
      ethereum.on('accountsChanged', async(accounts) => {
        if (accounts[0] != null){
          setCurrentAccount(accounts[0])
        }else{
          setCurrentAccount('')
        }
      })
    }

    const setupEventListener = async() =>{
      try{
        const {etherum} = window
        if(ethereum){
          const provider = new ethers.providers.Web3Provider(ethereum)
          const signer = provider.getSigner()
          const contract = new ethers.Contract(CONTRACT_ADDRESS, MNSContract.abi, signer)

          provider.once("block", () =>{
            contract.on("NewDomainMinted", (id, owner, name) =>{
              fetchMints();
              setopenSeaLink(`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${id}`)
            })

            contract.on("NewRecordSet", (name, record) =>{
              fetchMints();
            })
          })
        }
      }catch(error){
        console.log(error)
      }
    }
    setupEventListener()
    
  }, [])

  useEffect(() =>{
    if(network === "Polygon Mumbai Testnet"){
      fetchMints()
    }
  }, [currentAccount, network])

  const checkIfWalletIsConnected = async () =>{
    setIsConnecting(true)
    const { ethereum } = window
    if(!ethereum){
      console.log("MetaMask not available.")
      return;
    }

    const accounts = await ethereum.request({ method: 'eth_accounts'})
    if (accounts.length !== 0){
      const account = accounts[0]
      setCurrentAccount(account)
    }else{
      console.log("No authorised accounts found.")
    }

    const chainId = await ethereum.request({method: 'eth_chainId'})
    setNetwork(networks[chainId])

    ethereum.on('chainChanged', handleChainChanged);

    function handleChainChanged(_chainId){
      window.location.reload()
    }

    setIsConnecting(false)
  }

  const renderNotConnectedContainer = () =>{
    return (
      <div className="connect-wallet-container">
        <img style={{height: "200px"}} src= "https://ipfs.infura.io/ipfs/bafybeihunhav7gkztknf5wjcmf2j7d5gktwkgtmkhwo5arzke5vdm3abtq" alt="melon gif"/>
        <button 
          className="cta-button connect-wallet-button"
          onClick={connectWallet}
        >
          {isConnecting
            ? "Connecting..."
            : "Connect Wallet"
          }
        </button>
      </div>
    )
  }

  const connectWallet = async() =>{
    try{
      setIsConnecting(true)

      const {ethereum} = window;
      if(!ethereum){
        window.alert("Melon Name Service requires MetaMask. -> https://metamask.io/")
        return;
      }

      const accounts = await ethereum.request({method: "eth_requestAccounts"});
      setCurrentAccount(accounts[0])
      setIsConnecting(false)
    }catch(error){
      setIsConnecting(false)
      console.log(error)
    }
  }

  const switchNetwork = async() =>{
    if(window.ethereum){
      try{
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          // polygon mumbai testnet chainid
          params: [{chainId: '0x13881'}] 
        })
      }catch(error){
        // error code if the chain hasn't been added into Metamask yet
        // In that case, add the network.
        if(error.code === 4902){
          try{
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params:[
                {
                  chainId: '0x13881',
                  chainName: 'Polygon Mumbai Testnet',
                  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
                  nativeCurrency:{
                    name: "Mumbai Matic",
                    symbol: "MATIC",
                    decimals: 18
                  },
                  blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
                }
              ]
            })
          }catch(error){
            console.log(error)
          }
        }
        console.log(error)
      }
    }else{
      alert('MetaMask is not installed. Please install it to use Melon Name Service: https://metamask.io/download.html/')
    } 
  }

  // Render domain name and data
  const renderInputForm = () =>{
    if (network !== 'Polygon Mumbai Testnet'){
      return (
        <div className="connect-wallet-container">
          <p style={{color: "black", fontSize: '16px', fontWeight: 'bold'}}>Please connect to the Polygon Mumbai Testnet</p>
          <button className="cta-button mint-button" onClick={switchNetwork}>Click here to switch</button>
        </div>
      )
    }
    return (
      <div className="form-container">
        <form onSubmit = {(e)=>{
          e.preventDefault()
          mintDomain()
        }}

        >
          <div className="first-row">
            <input 
              type="text"
              value={domain}
              placeholder='Domain'
              required
              onChange={e => setDomain(e.target.value)}
            />
            <p className='tld melon-name'> {tld} </p>
          </div>

          <input 
            type="text"
            value={record}
            placeholder='Your Record'
            onChange={(e) => setRecord(e.target.value)}
          />
            {editing ? (
              <div className="button-container">
                <button className="cta-button mint-button" disabled={!editing || loading} onClick={updateDomain}>
                  {
                    loading
                    ? "Setting Record..."
                    : "Set Record"
                  }
                </button>

                <button className="cta-button mint-button" disabled={!editing || loading} onClick={()=>{setEditing(false); setDomain(''); setRecord('');}}>
                  Cancel
                </button>

              </div>


            ):(
              <div className="button-container">
                <button className="cta-button mint-button" disabled={isMintingDomain || isMintingRecord || loading}>
                  {isMintingDomain? "Minting Domain..." : isMintingRecord? "Minting Record..." : "Mint"}
                </button>
              </div>
            )}
          
        </form>

      </div>
    )
  }

  const renderMints = () =>{
    if(currentAccount && mints.length >0){
      return(
        <div className="mint-container">
          <p className="subtitle">Recently minted domains on Melon!</p>
          <div className="mint-list">
            {mints.map((mint, index) => {
              return (
                <div className="mint-item" key={index}>
                  <div className="mint-row">
                    <a 
                      className="link" 
                      href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`} 
                      target="_blank" 
                      rel="noopen noreferrer"
                    >
                      <p className="underlined">{' '}{mint.name}{tld}{' '}</p>
                    </a>
                    {mint.owner.toLowerCase() === currentAccount.toLowerCase()
                      ? 
                        <button className="edit-button" onClick={() => editRecord(mint.name)}>
                          <img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button"/>
                        </button>
                      : null
                    }
                  </div>
                  <p>{mint.record}</p>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
  }

  const editRecord = (name) =>{
    setEditing(true)
    setDomain(name)
  }

  const mintDomain = async () =>{
  
    if (!domain){
      return;
    }
    if (domain.length < 3){
      alert('Domain must be at least 3 characters long')
      return;
    }
    if (domain.length > 8){
      alert('Your domain has exceeded the 8 character limit')
      return;
    }

    const price = domain.length === 3? '0.5' : domain.length === 4 ? '0.3' : '0.1';
    console.log("Minting domain: ", domain, "with price ", price)

    try{
      const {ethereum} = window
      if(ethereum){
        setIsMintingDomain(true)

        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(CONTRACT_ADDRESS, MNSContract.abi, signer)

        console.log("Loading MetaMask to confirm transaction...")

        let tx = await contract.register(domain.toString(), {value: ethers.utils.parseEther(price), gasLimit: '10429720'})
        const receipt = await tx.wait()

        // check if transaction was completed successfully
        if (receipt.status === 1){
          setIsMintingDomain(false)
          setIsMintingRecord(true)

          console.log(`Domain minted! Visit https://mumbai.polygonscan.com/tx/${tx.hash}`)

          tx = await contract.setRecord(domain, record)
          await tx.wait()

          console.log(`Record set! Visit https://mumbai.polygonscan.com/tx/${tx.hash}`)

          setRecord('')
          setDomain('')
          handleShow()

        }else{
          alert("Transaction failed! Please try again.")
        }
        setIsMintingDomain(false)
        setIsMintingRecord(false)
      }

    }catch(error){
      console.log(error)
      setIsMintingDomain(false)
      setIsMintingRecord(false)
    }

  }

  const updateDomain = async () =>{
    if (!record || !domain){
      return;
    }
    setLoading(true)
    try{
      const { ethereum } = window;
      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        
        const contract = new ethers.Contract(CONTRACT_ADDRESS, MNSContract.abi, signer)

        let tx = await contract.setRecord(domain, record)
        await tx.wait()
        window.alert("Record Updated! Your txn: https://mumbai.polygonscan.com/tx/"+tx.hash)

        // fetchMints()
        setRecord('')
        setDomain('')

        setEditing(false)
      }
    }catch(error){
      console.log(error)
    }
    setLoading(false)
  }

  const fetchMints = async() =>{
    try{
      const {ethereum} = window
      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(CONTRACT_ADDRESS, MNSContract.abi, signer)

        const names = await contract.getAllNames()

        const mintRecords = await Promise.all(names.map(async (name)=>{
          const mintRecord = await contract.records(name)
          const owner = await contract.domains(name)
          return{
            id: names.indexOf(name),
            name: name,
            record: mintRecord,
            owner: owner,
          }
        }))
        console.log("MINTS FETCHED ", mintRecords)
        setMints(mintRecords)
      }
    }catch(error){
      console.log(error)
    }
  }

  return (
    <div className="App">
      <div className="container">

        <div className="header-container">
          <header>
            <div className="left">
              <p className="title"><span className="melon-name">Melon</span> Name Service</p>
              <p className="subtitle">Mint your Melon Domain today with&nbsp;
                <img alt="Polygon Logo" className="polygon-logo" src={polygonLogo} />
                &nbsp;Polygon Blockchain.
              </p>
            </div>
            <div className="right">
              <img 
                alt="Network logo" 
                className="logo" 
                src={network.includes("Polygon") ? polygonLogo : ethLogo}
              />
              { currentAccount 
                ? <p>Wallet: {currentAccount.slice(0,6)}...{currentAccount.slice(-4)}</p> 
                : <p>Not connected</p>
              }
            </div>
          </header>
        </div>

        <div> 

          <Modal 
            show={show} 
            size="lg"
            onHide={() => {handleClose(); setopenSeaLink('')}}
            aria-labelledby="contained-modal-title-vcenter"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Your Domain is available at OpenSea!</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div>
                <a 
                  className="link" 
                  href={openSeaLink} 
                  target="_blank" 
                  rel="noopen noreferrer"
                >
                  <p>{openSeaLink}</p>
                </a>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={()=>{handleClose(); setopenSeaLink('')}}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>

        </div>

        {!currentAccount && renderNotConnectedContainer()}
        {currentAccount && renderInputForm()}
        {mints && renderMints()}
        <div className="footer-container">
          <img alt="Github Logo" className="github-logo" src={githubLogo} />
          &nbsp;
          <a
            className="footer-text"
            href={GITHUB_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by | ${GITHUB_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
}

export default App;