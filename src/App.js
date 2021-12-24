import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'
import abi from './utils/WavePortal.json'
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css'
import Loader from 'react-loader-spinner'

export default function App() {
  const [currentAccount, setCurrentAccount] = useState('')
  const [allWaves, setAllWaves] = useState([])
  const [message, setMessage] = useState('')
  const [mining, setMining] = useState(false)
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS
  const contractABI = abi.abi

  const checkIfWalletIsConnected = async () => {
    try {
      // make sure that we have access to window.ethereum
      const { ethereum } = window

      if (!ethereum) {
        console.log('Make sure you have metamask!')
      } else {
        console.log('We have the ethereum object', ethereum)
      }

      // check if we are authorised to access the user's wallet
      const accounts = await ethereum.request({ method: 'eth_accounts' })

      if (accounts.length !== 0) {
        const account = accounts[0]
        console.log('Found an authorised account:', account)
        setCurrentAccount(account)
        getAllWaves()
      } else {
        console.log('No authorised account found')
      }
    } catch (error) {
      console.error(error)
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window

      if (!ethereum) {
        alert('Get MetaMask!')
        return
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      console.log('Connected', accounts[0])
      setCurrentAccount(accounts[0])
    } catch (error) {
      console.error(error)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window

      if (ethereum) {
        // connects to the ethereum network
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        )

        let count = await wavePortalContract.getTotalWaves()
        console.log('Retrieved total wave count...', count.toNumber())

        // execute the actual wave from the smart contract
        const waveTxn = await wavePortalContract.wave(message, {
          gasLimit: 300_000,
        })
        setMining(true)

        console.log('Mining...', waveTxn.hash)

        await waveTxn.wait()
        setMining(false)
        console.log('Mined -- ', waveTxn.hash)

        count = await wavePortalContract.getTotalWaves()
        console.log('Retrieved total wave count...', count.toNumber())
        getAllWaves()
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.error(error)
    }
  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        )
        // call the getAllWaves method from the smart contract
        const waves = await wavePortalContract.getAllWaves()

        const wavesCleaned = waves.map((wave) => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          }
        })

        setAllWaves(wavesCleaned)
      } else {
        console.error("Ethereum object doesn't exist")
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    let wavePortalContract

    const onNewWave = (from, timestamp, message) => {
      console.log('NewWave', from, timestamp, message)
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ])
    }

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      )
      wavePortalContract.on('NewWave', onNewWave)
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave)
      }
    }
  }, [])

  useEffect(() => {
    checkIfWalletIsConnected()
  }, [])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">👋 Hey there!</div>

        <div className="bio">
          I am <strong>Ben</strong> and I am a CS student at the National
          University of Singapore. Connect your Ethereum wallet and wave at me!
          :)
        </div>

        <input
          type="text"
          value={message}
          onChange={({ target }) => setMessage(target.value)}
          className="waveInput"
        />

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        {mining && (
          <div className="miningLoader">
            <Loader type="TailSpin" color="#ffde03" height={30} width={30} />
          </div>
        )}

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div
              key={index}
              style={{
                backgroundColor: 'OldLace',
                marginTop: '16px',
                padding: '8px',
              }}
            >
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
