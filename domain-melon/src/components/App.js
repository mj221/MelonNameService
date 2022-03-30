import React, {useEffect, useState} from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/App.css';

import githubLogo from '../assets/github-logo.svg';
import polygonLogo from '../assets/polygonlogo.png';
import ethLogo from '../assets/ethlogo.png';

import { networks } from '../utils/networks';
import { ethers } from "ethers";
import MNSContract from '../build/contracts/Domains.sol/Domains.json';

import {Modal , Button} from 'react-bootstrap';

// Infura IPFS
import { create } from 'ipfs-http-client';
const ipfs = create({host: 'ipfs.infura.io', port: 5001, protocol: 'https'});

// Constants
const GITHUB_HANDLE = 'mj221';
const GITHUB_LINK = `https://github.com/${GITHUB_HANDLE}`;

// Adding domain
const tld = '.melon';
// const CONTRACT_ADDRESS = "0x1d6bD115ea2fd76B089Fa54F5eF3BBf48BE2541E"
const jsonContractData = require('../build/contracts/contract-address.json');
let CONTRACT_ADDRESS = jsonContractData.MNSContractAddress

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
        const {ethereum} = window
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
                  <div className="d-flex align-items-center" style={{justifyContent: 'space-between'}}>
                    {
                      loading
                      ? "Setting Record"
                      : "Set Record"
                    }
                    &nbsp;
                    {
                      loading
                      ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      :null
                    }
                    
                  </div>
                </button>

                <button className="cta-button mint-button" disabled={!editing || loading} onClick={()=>{setEditing(false); setDomain(''); setRecord('');}}>
                  Cancel
                </button>

              </div>


            ):(
              <div className="button-container">
                <button className="cta-button mint-button" disabled={isMintingDomain || isMintingRecord || loading}>
                  <div className="d-flex align-items-center" style={{justifyContent: 'space-between'}}>
                    {
                      isMintingDomain
                      ? "Minting Domain"
                      : 
                        isMintingRecord
                        ? "Minting Record"
                        : "Mint"
                    }
                    &nbsp;
                    {
                      isMintingDomain || isMintingRecord
                      ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      :null
                    }
                  </div>
                  {/*{isMintingDomain? "Minting Domain..." : isMintingRecord? "Minting Record..." : "Mint"}*/}
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

        let ipfsPath = await uploadIPFS()
        let URIipfsPath = `ipfs://${ipfsPath}`;
        console.log("IPFS PATH IS HERE: ", URIipfsPath)

        let tx = await contract.register(domain.toString(), URIipfsPath,{value: ethers.utils.parseEther(price), gasLimit: '10429720'})
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

  const uploadIPFS = async () => {
    console.log("Submitting file to ipfs")

    try{
      const {ethereum} = window
      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(CONTRACT_ADDRESS, MNSContract.abi, signer)

        let tld = await contract.tld()

        // Change to domain
        let domainToSubmit = domain
        let combinedDomain = domainToSubmit.concat(".", tld)

        // change metadata
        // let metadata = "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNzAiIGhlaWdodD0iMjcwIiBmaWxsPSJub25lIj48cGF0aCBmaWxsPSJ1cmwoI0IpIiBkPSJNMCAwaDI3MHYyNzBIMHoiLz48ZGVmcz48ZmlsdGVyIGlkPSJBIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgaGVpZ2h0PSIyNzAiIHdpZHRoPSIyNzAiPjxmZURyb3BTaGFkb3cgZHg9IjAiIGR5PSIxIiBzdGREZXZpYXRpb249IjIiIGZsb29kLW9wYWNpdHk9Ii4yMjUiIHdpZHRoPSIyMDAlIiBoZWlnaHQ9IjIwMCUiLz48L2ZpbHRlcj48L2RlZnM+PHBhdGggZD0iTTcyLjg2MyA0Mi45NDljLS42NjgtLjM4Ny0xLjQyNi0uNTktMi4xOTctLjU5cy0xLjUyOS4yMDQtMi4xOTcuNTlsLTEwLjA4MSA2LjAzMi02Ljg1IDMuOTM0LTEwLjA4MSA2LjAzMmMtLjY2OC4zODctMS40MjYuNTktMi4xOTcuNTlzLTEuNTI5LS4yMDQtMi4xOTctLjU5bC04LjAxMy00LjcyMWE0LjUyIDQuNTIgMCAwIDEtMS41ODktMS42MTZjLS4zODQtLjY2NS0uNTk0LTEuNDE4LS42MDgtMi4xODd2LTkuMzFjLS4wMTMtLjc3NS4xODUtMS41MzguNTcyLTIuMjA4YTQuMjUgNC4yNSAwIDAgMSAxLjYyNS0xLjU5NWw3Ljg4NC00LjU5Yy42NjgtLjM4NyAxLjQyNi0uNTkgMi4xOTctLjU5czEuNTI5LjIwNCAyLjE5Ny41OWw3Ljg4NCA0LjU5YTQuNTIgNC41MiAwIDAgMSAxLjU4OSAxLjYxNmMuMzg0LjY2NS41OTQgMS40MTguNjA4IDIuMTg3djYuMDMybDYuODUtNC4wNjV2LTYuMDMyYy4wMTMtLjc3NS0uMTg1LTEuNTM4LS41NzItMi4yMDhhNC4yNSA0LjI1IDAgMCAwLTEuNjI1LTEuNTk1TDQxLjQ1NiAyNC41OWMtLjY2OC0uMzg3LTEuNDI2LS41OS0yLjE5Ny0uNTlzLTEuNTI5LjIwNC0yLjE5Ny41OWwtMTQuODY0IDguNjU1YTQuMjUgNC4yNSAwIDAgMC0xLjYyNSAxLjU5NWMtLjM4Ny42Ny0uNTg1IDEuNDM0LS41NzIgMi4yMDh2MTcuNDQxYy0uMDEzLjc3NS4xODUgMS41MzguNTcyIDIuMjA4YTQuMjUgNC4yNSAwIDAgMCAxLjYyNSAxLjU5NWwxNC44NjQgOC42NTVjLjY2OC4zODcgMS40MjYuNTkgMi4xOTcuNTlzMS41MjktLjIwNCAyLjE5Ny0uNTlsMTAuMDgxLTUuOTAxIDYuODUtNC4wNjUgMTAuMDgxLTUuOTAxYy42NjgtLjM4NyAxLjQyNi0uNTkgMi4xOTctLjU5czEuNTI5LjIwNCAyLjE5Ny41OWw3Ljg4NCA0LjU5YTQuNTIgNC41MiAwIDAgMSAxLjU4OSAxLjYxNmMuMzg0LjY2NS41OTQgMS40MTguNjA4IDIuMTg3djkuMzExYy4wMTMuNzc1LS4xODUgMS41MzgtLjU3MiAyLjIwOGE0LjI1IDQuMjUgMCAwIDEtMS42MjUgMS41OTVsLTcuODg0IDQuNzIxYy0uNjY4LjM4Ny0xLjQyNi41OS0yLjE5Ny41OXMtMS41MjktLjIwNC0yLjE5Ny0uNTlsLTcuODg0LTQuNTlhNC41MiA0LjUyIDAgMCAxLTEuNTg5LTEuNjE2Yy0uMzg1LS42NjUtLjU5NC0xLjQxOC0uNjA4LTIuMTg3di02LjAzMmwtNi44NSA0LjA2NXY2LjAzMmMtLjAxMy43NzUuMTg1IDEuNTM4LjU3MiAyLjIwOGE0LjI1IDQuMjUgMCAwIDAgMS42MjUgMS41OTVsMTQuODY0IDguNjU1Yy42NjguMzg3IDEuNDI2LjU5IDIuMTk3LjU5czEuNTI5LS4yMDQgMi4xOTctLjU5bDE0Ljg2NC04LjY1NWMuNjU3LS4zOTQgMS4yMDQtLjk1IDEuNTg5LTEuNjE2cy41OTQtMS40MTguNjA5LTIuMTg3VjU1LjUzOGMuMDEzLS43NzUtLjE4NS0xLjUzOC0uNTcyLTIuMjA4YTQuMjUgNC4yNSAwIDAgMC0xLjYyNS0xLjU5NWwtMTQuOTkzLTguNzg2eiIgZmlsbD0icmVkIi8+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJCIiB4MT0iMCIgeTE9IjAiIHgyPSIyNzAiIHkyPSIyNzAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBzdG9wLWNvbG9yPSJwdXJwbGUiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9InJlZCIgc3RvcC1vcGFjaXR5PSIuOTkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48dGV4dCB4PSIzMi41IiB5PSIyMzEiIGZvbnQtc2l6ZT0iMjciIGZpbGw9IiNmZmYiIGZpbHRlcj0idXJsKCNBKSIgZm9udC1mYW1pbHk9IlBsdXMgSmFrYXJ0YSBTYW5zLERlamFWdSBTYW5zLE5vdG8gQ29sb3IgRW1vamksQXBwbGUgQ29sb3IgRW1vamksc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9ImJvbGQiPk5NSy5tZWxvbjwvdGV4dD48L3N2Zz4="
        let metadata = randomiseSVG(combinedDomain)
        let length = domainToSubmit.length;
        let domainNFTJson = {
          "name": combinedDomain,
          "description": "A domain on the Melon name service",
          "image": `data:image/svg+xml;base64,${metadata}`,
          "length": length
        };

        let jsonObj = JSON.stringify(domainNFTJson);

        console.log("NFT METADATA: ", jsonObj)
        const file = await ipfs.add(jsonObj)
        console.log("FILE: ", file.path)
        return file.path;
        
      }
    }catch(error){
      console.log(error)
    }
    
  }

  const randomiseSVG= (name) =>{
    const colors = ["red", "black", "yellow", "blue", "green", "orange", "purple"];

    const svgPartOne = '<svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" fill="none"><path fill="url(#B)" d="M0 0h270v270H0z"/><defs><filter id="A" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/></filter></defs><path d="M72.863 42.949c-.668-.387-1.426-.59-2.197-.59s-1.529.204-2.197.59l-10.081 6.032-6.85 3.934-10.081 6.032c-.668.387-1.426.59-2.197.59s-1.529-.204-2.197-.59l-8.013-4.721a4.52 4.52 0 0 1-1.589-1.616c-.384-.665-.594-1.418-.608-2.187v-9.31c-.013-.775.185-1.538.572-2.208a4.25 4.25 0 0 1 1.625-1.595l7.884-4.59c.668-.387 1.426-.59 2.197-.59s1.529.204 2.197.59l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616c.384.665.594 1.418.608 2.187v6.032l6.85-4.065v-6.032c.013-.775-.185-1.538-.572-2.208a4.25 4.25 0 0 0-1.625-1.595L41.456 24.59c-.668-.387-1.426-.59-2.197-.59s-1.529.204-2.197.59l-14.864 8.655a4.25 4.25 0 0 0-1.625 1.595c-.387.67-.585 1.434-.572 2.208v17.441c-.013.775.185 1.538.572 2.208a4.25 4.25 0 0 0 1.625 1.595l14.864 8.655c.668.387 1.426.59 2.197.59s1.529-.204 2.197-.59l10.081-5.901 6.85-4.065 10.081-5.901c.668-.387 1.426-.59 2.197-.59s1.529.204 2.197.59l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616c.384.665.594 1.418.608 2.187v9.311c.013.775-.185 1.538-.572 2.208a4.25 4.25 0 0 1-1.625 1.595l-7.884 4.721c-.668.387-1.426.59-2.197.59s-1.529-.204-2.197-.59l-7.884-4.59a4.52 4.52 0 0 1-1.589-1.616c-.385-.665-.594-1.418-.608-2.187v-6.032l-6.85 4.065v6.032c-.013.775.185 1.538.572 2.208a4.25 4.25 0 0 0 1.625 1.595l14.864 8.655c.668.387 1.426.59 2.197.59s1.529-.204 2.197-.59l14.864-8.655c.657-.394 1.204-.95 1.589-1.616s.594-1.418.609-2.187V55.538c.013-.775-.185-1.538-.572-2.208a4.25 4.25 0 0 0-1.625-1.595l-14.993-8.786z" fill="';
    const svgPartTwo = '"/><defs><linearGradient id="B" x1="0" y1="0" x2="270" y2="270" gradientUnits="userSpaceOnUse"><stop stop-color="';
    const svgPartThree = '"/><stop offset="1" stop-color="';

    const svgPartFour = '" stop-opacity=".99"/></linearGradient></defs><text x="32.5" y="231" font-size="27" fill="#fff" filter="url(#A)" font-family="Plus Jakarta Sans,DejaVu Sans,Noto Color Emoji,Apple Color Emoji,sans-serif" font-weight="bold">';
    const svgPartFive = '</text></svg>';

    let randomColorSymbol = colors[Math.floor(Math.random() * colors.length)];
    let randomColorGradient1 = colors[Math.floor(Math.random() * colors.length)];
    let randomColorGradient2 = colors[Math.floor(Math.random() * colors.length)];

    while(randomColorSymbol === randomColorGradient1){
      randomColorGradient1 = colors[Math.floor(Math.random() * colors.length)];
    }

    const finalSvg = svgPartOne.concat(
      randomColorSymbol, 
      svgPartTwo,
      randomColorGradient1,
      svgPartThree,
      randomColorGradient2,
      svgPartFour,
      name,
      svgPartFive
    )
    var base64EncodedSVG = btoa(finalSvg);
    return base64EncodedSVG;
  }

  const updateDomain = async () =>{
    if (!domain){
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