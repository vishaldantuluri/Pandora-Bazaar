// SPDX-License-Identifier: MIT

pragma solidity 0.8.0;

import "../../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../../node_modules/@openzeppelin/contracts/utils/math/safeMath.sol";
import "../../node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract myToken is ERC721, Ownable {

    using SafeMath for uint;

    mapping(uint => address) tokenToAddress;
    mapping(address => uint) addressToTokens;
    mapping(uint => string) tokenToIpfs;
    mapping(string => uint) ipfsToToken;
    mapping(uint => bool) forSale;
    mapping(uint => uint) priceOfToken;
    mapping(address => uint) addressWallet;
    uint tokenId;

    constructor() ERC721("Item", "ITM") {
        tokenId = 0;
    }

    receive() external payable {
        addressWallet[msg.sender] = addressWallet[msg.sender].add(msg.value);
    }

    function createToken(string memory _ipfs) public {

        tokenToAddress[tokenId] = msg.sender;
        addressToTokens[msg.sender] = addressToTokens[msg.sender].add(1);
        tokenToIpfs[tokenId] = _ipfs;
        ipfsToToken[_ipfs] = tokenId;
        _safeMint(msg.sender, tokenId);
        tokenId = tokenId.add(1);

    }

    function sendToken(address _from, address payable _to, uint _tokenId) internal {
        require(tokenToAddress[_tokenId] == _from);
        safeTransferFrom(_from, _to, _tokenId);
        tokenToAddress[_tokenId] = _to;
        addressToTokens[_from] = addressToTokens[_from].sub(1);
        addressToTokens[_to] = addressToTokens[_to].add(1);
    }

    function buyToken(uint _tokenId) payable public {
        require(forSale[_tokenId] == true, "This Token is not for sale");
        address payable _owner = payable(tokenToAddress[_tokenId]);
        address payable _to = payable(msg.sender);
        require(_owner != _to);
        require(addressWallet[_to] >= priceOfToken[_tokenId], "Full amount has to be paid");
        _approve(_to, _tokenId);
        _owner.transfer(priceOfToken[_tokenId]);
        sendToken(_owner, _to, _tokenId);
        forSale[_tokenId] = false;
        priceOfToken[_tokenId] = 0;
    }

    function sellToken(uint _tokenId, uint _price) public {
        require(_tokenId <= tokenId, "token with this Id doesn't exist");
        require(msg.sender == tokenToAddress[_tokenId], "this address does not own this token");
        forSale[_tokenId] = true;
        priceOfToken[_tokenId] = _price;

    }

    function getPrice(uint _tokenId) public view returns(uint) {
        return priceOfToken[_tokenId];
    }

    function isForSale(uint _tokenId) public view returns(bool) {
        require(_tokenId <= tokenId, "token with this Id doesn't exist");
        return forSale[_tokenId];
    }

    function getIpfsFromId(uint _tokenId) public view returns(string memory) {
        require(_tokenId <= tokenId, "token with this Id doesn't exist");
        string memory res = tokenToIpfs[_tokenId];
        return res;
    }
    
    function getIdFromIpfs(string memory _ipfs) public view returns(uint) {
        return ipfsToToken[_ipfs];
    }

    function getAddressFromId(uint _tokenId) public view returns(address) {
        return tokenToAddress[_tokenId];
    }

    function getBalance() public view returns(uint) {
        return address(this).balance;
    }
}