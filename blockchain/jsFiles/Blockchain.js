const CryptoJS = require('crypto-js');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Blockchain {
	constructor() {
		const genesis = {
			index: 0,
			data: { voteId: "GENESIS" },
			hash: "GENESIS"
		}
		this.chain = []
		this.chain.push(genesis)
	}
	getBlockHash(block) {
		const toBeHashed = block.timestamp + block.data + block.sender;
		const hashedBlock = CryptoJS.SHA256(toBeHashed).toString(CryptoJS.enc.Hex);
		return hashedBlock;
	}
	signHash(hash, key) {
		const signedHash = key.sign(hash).toDER()
		const signedString = "[" + signedHash.toString() + "]"
		return signedString
	}
	generateNewBlock(data, privKey) {
		const index = 0
		const prevHash = this.getLatestBlock().hash
		const timestamp = new Date().getTime()
		const key = ec.keyFromPrivate(privKey, 'hex')
		const sender = key.getPublic().encode('hex')

		var block = {
			index: index,
			prevHash: prevHash,
			timestamp: timestamp,
			data: data,
			sender: sender,
		}
		block.hash = this.getBlockHash(block)
		block.sign = this.signHash(block.hash, key)
		return block
	}
	checkBlockSign(newBlock) {
		const pbKey = ec.keyFromPublic(newBlock.sender, 'hex')
		const signed = JSON.parse(newBlock.sign);
		const result = pbKey.verify(newBlock.hash, signed);
		return result
	}
	isNewBlockValid(newBlock) {
		if (this.getBlockchainLength() != newBlock.index) {
			console.log("Invalid Index !");
			return false;
		} else if (this.chain[(this.getBlockchainLength() - 1)].hash !== newBlock.prevHash) {
			console.log("Invalid Previous Hash !");
			return false;
		} else if (this.getBlockHash(newBlock) !== newBlock.hash) {
			console.log("Invalid Hash !");
			return false;
		} else if (!this.checkBlockSign(newBlock)) {
			console.log("Invalid Sign")
			return false
		}else {
			return true;
		}

	}
	addNewBlock(newBlock) {
		if (this.isNewBlockValid(newBlock)) {
			this.chain.push(newBlock)
		} else {
			console.log("Invalid New Block")
		}
	}

	getLatestBlock() 		{ return this.chain[(this.chain.length - 1)] }
	replaceChain(data)		{ this.chain = data.chain }
	getBlockchainLength()	{ return this.chain.length }
}



class MainChain {
	constructor() {
		this.main = {
			transactions: new Blockchain(),
			contracts: new Blockchain()
		}
	}
	getContractsLength() { return this.main.contracts.getBlockchainLength() }
	getLatestContractsHash() { return this.main.contracts.getLatestBlock().hash }
	getTransactionsLength() { return this.main.transactions.getBlockchainLength()  }
	getLatestTransactionsHash() { return this.main.transactions.getLatestBlock().hash }
}

module.exports = MainChain
