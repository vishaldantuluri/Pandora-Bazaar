import React, { Component } from 'react';
import './App.css';
import Web3 from 'web3'
import IpfsHash from '../abis/IpfsHash.json'
import MyToken from '../abis/myToken.json'


const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: '5001', protocol: 'https' });


class App extends Component {

  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3;
    const account = await window.ethereum.selectedAddress;
    this.setState({account})
    const netId = await web3.eth.net.getId();
    const networkData = IpfsHash.networks[netId];
    const networkDataNft = MyToken.networks[netId];
    if(networkData){
      const abi = IpfsHash.abi;
      const abiNft = MyToken.abi;
      const address = networkData.address;
      const addressNft = networkDataNft.address
      const contract = web3.eth.Contract(abi, address);
      const contractNft = web3.eth.Contract(abiNft, addressNft);
      this.setState({contract})
      this.setState({ contractNft })
      const imgHash = await contract.methods.getHash().call();
      this.setState({imgHash})
    }else {
      window.alert('smart contract not deployed to detected network')
    }
  }

  constructor(props) {
    super(props);
    this.state = {
      account: '',
      buffer: null,
      contract: null,
      contractNft: null,
      imgHash: "",
      transactionHash: "",
      tokenId: null,
      sellingTokenId: null,
      sellingTokenPrice: null,
      isForSale: null,
      owner: null,
      buyingTokenId: null,
      addressNft: null
    };
  }

  reloadPage = ( )=> {
    window.location.reload();
  }


  captureFile = async (event) => {
    event.preventDefault();

    console.log('capturing file');
    const file = event.target.files[0];

    const account = await window.ethereum.selectedAddress;
    this.setState({account})

    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) });
    }
  }

  captureTokenId = async (event) => {
    event.preventDefault();
    console.log("fetching token Id");
    const tokenId = event.target.value
    this.setState({ tokenId })

    const account = await window.ethereum.selectedAddress;
    this.setState({account});

  }

  captureBuyingTokenId = async (event) => {
    event.preventDefault();

    console.log("capturing token Id to buy");
    const buyingTokenId = event.target.value;
    const account = await window.ethereum.selectedAddress;
    this.setState({account})
    this.setState({ buyingTokenId });
  }

  captureSellingTokenId = async (event) => {
    event.preventDefault();

    console.log("fetching token Id to sell");
    const sellingTokenId = event.target.value;
    const account = await window.ethereum.selectedAddress;
    this.setState({account})
    this.setState({ sellingTokenId })
  }

  captureTokenPrice = async (event) => {
    event.preventDefault();

    console.log("fetching token Price");
    const sellingTokenPrice = event.target.value;
    const account = await window.ethereum.selectedAddress;
    this.setState({account})
    this.setState({ sellingTokenPrice })
  }

  onSubmit = async (event) => {
    event.preventDefault();

    const account = await window.ethereum.selectedAddress;
    this.setState({account})

    await ipfs.add(this.state.buffer, async (error, result) => {
      if(error){
        console.error(error);
        return;
      }
      console.log('ipfs result', result);
      const imgHash = result[0].hash;
      
      await this.state.contract.methods.setHash(imgHash).send({from: this.state.account, gas:100000}).then((r) => {
        console.log("setHash result", r);
        this.setState({ imgHash });
      });
      await this.state.contractNft.methods.createToken(imgHash).send({from: this.state.account, gas:1000000}).then((r) => {
        console.log("created token return", r);
        this.setState({ transactionHash: r.transactionHash })
        this.setState({ owner: this.state.account })
        console.log(r.transactionHash);
      })
      
      await this.state.contractNft.methods.getIdFromIpfs(imgHash).call().then((r) => {
        const tokenId = r.toString(10);
        console.log("New token id: ",tokenId);
        this.setState({ tokenId })
      });
    })
    console.log('submitting');
  }

  sellToken = async (event) => {
    const web3 = window.web3;
    event.preventDefault();

    const account = await window.ethereum.selectedAddress;
    this.setState({account})

    await this.state.contractNft.methods.sellToken(this.state.sellingTokenId, web3.utils.toWei(this.state.sellingTokenPrice, 'ether')).send({from: this.state.account});
    await this.state.contractNft.methods.isForSale(this.state.sellingTokenId).call().then((r) => {
      console.log("Token is for sale: ",r);
      this.setState({ isForSale: r });
    })
  }

  displayToken = async (event) => {
    event.preventDefault();
    const web3 = window.web3;

    const account = await window.ethereum.selectedAddress;
    this.setState({account})

    const tokenId = this.state.tokenId;

    await this.state.contractNft.methods.getIpfsFromId(tokenId).call().then((r) => {
      console.log("IPFS hash: ",r);
      this.setState({ imgHash: r });
    })

    await this.state.contractNft.methods.getAddressFromId(tokenId).call().then((r) => {
      console.log("Owner of token: ",r);
      this.setState({ owner: r });
    })

    await this.state.contractNft.methods.isForSale(tokenId).call().then((r) => {
      console.log("Token is for sale: ",r);
      const isForSale = r.toString()
      this.setState({ isForSale });
    })

    await this.state.contractNft.methods.getPrice(tokenId).call().then((r) => {
      console.log("Token price: ",r);
      const sellingTokenPrice = web3.utils.fromWei(r.toString(), 'ether')
      this.setState({ sellingTokenPrice });
    })

    
  }

  buyToken = async (event) => {
    event.preventDefault();

    const account = await window.ethereum.selectedAddress;
    this.setState({account})

    const tokenId = this.state.buyingTokenId;
    const web3 = window.web3;
    await this.state.contractNft.methods.getPrice(tokenId).call().then((r) => {
      console.log("Token price: ",r);
      const sellingTokenPrice = web3.utils.fromWei(r.toString(), 'ether')
      this.setState({ sellingTokenPrice });
    })
    await web3.eth.sendTransaction({from: this.state.account, to: this.state.contractNft.address, value: web3.utils.toWei(this.state.sellingTokenPrice)}).then((r) => {
      console.log(r);
    })
    await this.state.contractNft.methods.buyToken(tokenId).send({from: this.state.account, gasPrice: web3.utils.toWei("20", "gwei")}).then((r) => {
      console.log("Bought token return",r);
    })
  }

  render() {
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="https://pandora.finance/"
            target="_blank"
            rel="noopener noreferrer"
          >
            NFT Market place
          </a>
          <ul className="navbar-nav px-3">
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <small className="text-white">{this.state.account}</small>
            </li>
          </ul>
        </nav>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
    
                <img src={`https://ipfs.infura.io/ipfs/${this.state.imgHash}`} className="App-logo" alt="logo" />
                
                <div>
                  <p>ipfs Hash : {this.state.imgHash}</p>
                  <p>Token id : {this.state.tokenId}</p>
                  <p>Owner account : {this.state.owner}</p>
                  <p>Create token tx# : {this.state.transactionHash}</p>
                  <p>Token is for sale: {this.state.isForSale}</p>
                  <p>Price of Token: {this.state.sellingTokenPrice} eth</p>
                </div>
                <h2>Upload file to convert to NFT</h2>
                <form onSubmit = {this.onSubmit}>
                  <input type = "file" onChange = {this.captureFile}/>
                  <input type = "submit" />
                </form>
                <br></br>
                <h2>Display Token</h2>
                <form onSubmit = {this.displayToken}>
                  <input placeholder = "Token Id" onChange = {this.captureTokenId}></input>
                  <input type = "submit" />
                </form>
                <br></br>
                <h2>Sell token</h2>
                <form onSubmit = {this.sellToken}>
                  <input type = "number" placeholder = "Token id :" onChange = {this.captureSellingTokenId}/>
                  <input placeholder = "Token selling price :" onChange = {this.captureTokenPrice}/>
                  <input type = "submit" />
                </form>
                <br></br>
                <h2>Buy Token</h2>
                <form onSubmit = {this.buyToken}>
                  <input placeholder = "Token Id" onChange = {this.captureBuyingTokenId}></input>
                  <input type = "submit" />
                </form>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
