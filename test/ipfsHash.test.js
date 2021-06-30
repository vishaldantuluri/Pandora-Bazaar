const { assert } = require('chai');

const ipfsHash = artifacts.require('ipfsHash');
const myToken = artifacts.require("myToken");

const chai = require('chai').use(require('chai-as-promised')).should();

const BN = web3.utils.BN;


contract('myToken', async (accounts) => {
    let MyToken;

    const [alice, bob] = accounts;

    beforeEach(async () => {
        MyToken = await myToken.deployed();
    })

    describe('deployment', async () => {

        it('deploys successfully', async () => {
            
            const address = MyToken.address;
            assert.notEqual(address, 0x0);
            assert.notEqual(address, "");
            assert.notEqual(address, null);
            assert.notEqual(address, undefined);
        })

    })

    describe('minting and transactions', async () => {

        it('creates a token properly', async () => {
            const inp = "abc123";
            MyToken.createToken(inp);
            const tokenId = await MyToken.tokenId;
            const id1 = tokenId - 1;
            const id2 = await MyToken.getIdFromIpfs(inp);
            assert.equal(new BN(id1).toString(), new BN(id2).toString())
        })
    })
})

contract('ipfsHash', async (accounts) => {
    let Ipfs;

    beforeEach(async () => {
        Ipfs = await ipfsHash.deployed();
    })

    describe('deployment', async () => {

        it('deploys successfully', async () => {
            
            const address = Ipfs.address;
            assert.notEqual(address, 0x0);
            assert.notEqual(address, "");
            assert.notEqual(address, null);
            assert.notEqual(address, undefined);
        })

    })

    describe('storage', async () => [

        it('stores the value of ipfs hash', async () => {

            let hx = 'abc133';
            await Ipfs.setHash(hx);
            const result = await Ipfs.getHash();
            assert.equal(hx, result);
        })
    ])

})