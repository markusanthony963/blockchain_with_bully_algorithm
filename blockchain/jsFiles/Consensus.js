import {AsyncStorage} from 'react-native';
const IP_ADDRESS =  global.IP_ADDRESS
const socket = require('socket.io-client')(IP_ADDRESS);
const Blockchain = require('./Blockchain')
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
var blockchain = new Blockchain()
var hasLeader = false
var isLeader = false
var heartbeatTimer = 2000 
var setTimeoutHb , setBullyTimeout
var bullyTimeout = 1000
var timeoutHb = RandomTimeout()
var point = randomPoin(10)
var okCounter = false
var voteResult = 0
var blockPool = [] 
var isPooling = false
var currentPoolData = ""
var currentPoolType = ""
var dataVoteResult = []
var setTimeoutProcess

global.isConnected = false

var timeoutSyncing
var isFirstTimeSynced = false 

var timeStamp = Math.floor(Date.now());

function verifyMessage(msg, sign, key) {
	var pbKey = ec.keyFromPublic(key, 'hex')
	var signed = JSON.parse(sign);
	var result = pbKey.verify(msg, signed);
	return result;
}

function checkResult(connectedUsers, resultArray) {
	var halfUsers = Math.ceil(connectedUsers / 2);
	var trueCount = 0;
	for (var x = 0; x < resultArray.length; x++) {
		if (resultArray[x]) {
			trueCount++;
		}
	}
	
	if (trueCount >= halfUsers) {
		return true;
	} else {
		return false;
	}
}


socket.on('connect', () => {
  console.log("Connected!");

  global.isConnected = true
  firstTime()
});

function firstTime(){
  console.log('ID = ' + socket.id);
  console.log('POINT = ' + point);
  console.log('timestamp = '+timeStamp);
  ResetTimer()
  resetPoolTimeout()
  AsyncStorage.getItem(global.blockchain, (err,res)=>{
      if(!err && res){
          const storedBlockchain = JSON.parse(res)
          blockchain.main.transactions.replaceChain(storedBlockchain.transactions)
          blockchain.main.contracts.replaceChain(storedBlockchain.contracts)
          console.log("has leader ? " + hasLeader);
          
          console.log("success get blockchain");
          console.log("BLOCKCHAIN : " )
          console.log(JSON.stringify(storedBlockchain));
          
      }
      timeoutSyncing = setInterval(()=>{
          if(hasLeader && !isFirstTimeSynced){
              console.log("begin syncing blockchain");
              
              socket.emit('RequestSync', socket.id)
          }
      }, 500)
  })
}

socket.on('SyncRequest',(userID)=>{
    const lastData = JSON.stringify(blockchain.main)
    socket.emit('SendSync',lastData,JSON.stringify(blockPool),userID )

})
socket.on('SyncListener',(chain,pool)=>{
    const newBlockchain = JSON.parse(chain)
    blockPool = JSON.parse(pool)

    blockchain.main.transactions.replaceChain(newBlockchain.transactions)
    blockchain.main.contracts.replaceChain(newBlockchain.contracts)

    const storeData = JSON.stringify(blockchain.main)
    AsyncStorage.setItem(global.blockchain, storeData, ()=>{
        isFirstTimeSynced = true
        clearTimeout(timeoutSyncing)
        console.log("Blockchain Synced");
        
    })
})

function ResetTimer(){
  clearTimeout(setTimeoutHb)

  setTimeoutHb = setTimeout(()=>{
      console.log('REQUEST NEW ELECTION !!!')
      Election()
  },timeoutHb)
}

function waitingForLeaderTimeout(){
  if(okCounter == true){
    clearTimeout(setTimeout)
  }else{
    setBullyTimeout = setTimeout(()=>{
        socket.emit("newLeader",selfID)
    },bullyTimeout)
  }
}

function RandomTimeout() {
	const min = 2750;
	const max = 3001;
  var random = Math.floor(Math.random() * (max - min + 1)) + min;
  console.log(random);
	return random
}

function Election(){
  socket.emit('beginElection', socket.id,point,timeStamp)
  console.log("timestamp : "+ timeStamp);
  
}

socket.on('testingPoint',(candidateID,candidatePoint,candidateTimeStamp)=>{
  selfID = socket.id
  selfPoint = point
  selfTimeStamp = timeStamp
  
  if(candidatePoint > selfPoint){
    console.log("voting for :" + candidateID + " true by : "+ selfID);
    socket.emit('voteForCandidate',candidateID,true,selfID)
  }else if(candidatePoint == selfPoint){
      console.log("point sama ");
      console.log("candidate timestamp : "+ candidateTimeStamp+ "self timestamp: "+ selfTimeStamp);
      
      if(candidateTimeStamp >= selfTimeStamp){
        console.log("voting for :" + candidateID + " true by : "+ selfID);
        socket.emit('voteForCandidate',candidateID,true,selfID)            
      }
  }
})

socket.on('waitingForLeader',()=>{
  console.log("ok, waiting for new leader");
  okCounter = true
  clearTimeout(setBullyTimeout)
  setBullyTimeout = setTimeout(()=>{
      console.log('REQUEST NEW ELECTION !!!')
      Election()
  },bullyTimeout)
})

socket.on('leaderVoteResult',(leaderID, result,onlineUser)=>{
  if (result) {
    voteResult++
    console.log("vote result : "+voteResult);
    
    if(voteResult == onlineUser){
        console.log("NEW LEADER : "+leaderID + "RESULT : "+result);
        console.log('NEW LEADER ELECTED')
        voteResult = 0
        isLeader = true
        hasLeaderM()
    }
  }
})

function hasLeaderM() {
  hasLeader = true
  socket.emit('leaderElected',socket.id)
  timeoutHb = RandomTimeout()//3000
}

function randomPoin(max){
  return Math.floor(Math.random()*Math.floor(max))
}

socket.on('disconnect', () => {

    global.isConnected = false
})

function resetPoolTimeout() {
	setTimeoutPool = setInterval(() => {
		if (!isPooling) {
			processPooledData();
		}
	}, 100);
}
function processPooledData() {
	if (isLeader && blockPool.length != 0) {
        console.log("blockpool : " + blockPool);
        
		isPooling = true
		currentPoolData = JSON.parse(blockPool[0].block) //masukin latest blockpool ke current
		currentPoolType = blockPool[0].type

		if (currentPoolType == "CONTRACTS") {
			currentPoolData.index = blockchain.getContractsLength()
			currentPoolData.prevHash = blockchain.getLatestContractsHash()
		} else if (currentPoolType == "TRANSACTIONS") {
			currentPoolData.index = blockchain.getTransactionsLength()
			currentPoolData.prevHash = blockchain.getLatestTransactionsHash()
		}
		currentPoolData = JSON.stringify(currentPoolData)

		socket.emit('ProcessPool', currentPoolData, currentPoolType)
	}
}

//
socket.on('DataToVote', (block, type) => { // All
    isPooling = true;
    console.log("data to vote");
    
	const newBlock = JSON.parse(block)
    const keyValid = verifyMessage(newBlock.hash, newBlock.sign, newBlock.sender)
    console.log("NEW BLOCK : " + newBlock );
    
    console.log("key is valid ? " + keyValid);
    
	var latestBlock, blockValid, contractValid,transactionValid
	var contractOverallValid, transactionOverallValid

	AsyncStorage.getItem(global.blockchain, (err, res) => {
		if (!err && res) {
            console.log("response : " + res);
            
			const contractData = JSON.parse(res).contracts.chain
			const transactionList = JSON.parse(res).transactions.chain

			for (var x = 0; x < contractData.length; x++) {
				if (contractData[x].data.voteId == newBlock.data.voteId) {
					contractValid = true
					for (var y = 0; y < transactionList.length; y++) {
						if (transactionList[y].data.voteId == newBlock.data.voteId) {
							if (transactionList[y].sender == newBlock.sender) {
								transactionValid = true
							} else {
								transactionValid = false
							}
						} 
					}
					break
				} else {
					contractValid = false
				}
			}
			if (type == "TRANSACTIONS") {
				contractOverallValid = contractValid
				transactionOverallValid = !transactionValid
				latestBlock = blockchain.main.transactions.getLatestBlock()
				blockValid = blockchain.main.transactions.isNewBlockValid(newBlock)
			} else if (type == "CONTRACTS") {
				contractOverallValid = !contractValid
				transactionOverallValid = true
				latestBlock = blockchain.main.contracts.getLatestBlock()
				blockValid = blockchain.main.contracts.isNewBlockValid(newBlock)
			}
			var result = false;
			if (keyValid && blockValid && contractOverallValid && transactionOverallValid) {
                result = true;
                console.log("VALIDITY: TRUE");
                
			}
			socket.emit('VoteForData', result);
		} else {
			socket.emit('VoteForData', false);
		}
	})

});

socket.on('DataVoteResult', (result, connectedUsers) => { // Leader
	dataVoteResult.push(result);
	clearTimeout(setTimeoutProcess);
	setTimeoutProcess = setTimeout(() => {
		if (checkResult(connectedUsers, dataVoteResult)) {
            console.log("data berhasil masuk");
            
			socket.emit('CommitData', currentPoolData, currentPoolType)
		} else {
            console.log("data gagal masuk");
			socket.emit('RemoveData');
		}
		dataVoteResult = []
	}, 100)
});

socket.on('DataToRemove', () => { 
	blockPool.splice(0, 1);
	isPooling = false;
	console.log("DISCARD")
})
socket.on('DataToCommit', (pool, type) => { 
	const newBlock = JSON.parse(pool)
	if (type == "TRANSACTIONS") {
		blockchain.main.transactions.addNewBlock(newBlock)
	} else if (type == "CONTRACTS") {
		blockchain.main.contracts.addNewBlock(newBlock)
	} else {
		console.log("No Type")
	}
	const storeData = JSON.stringify(blockchain.main)
	AsyncStorage.setItem(global.blockchain, storeData, () => {
		blockPool.splice(0, 1);
		isPooling = false;
		console.log("COMMITED")
	})

});
//

setInterval(()=>{
  if(isLeader){
    socket.emit('sendHeartbeat',socket.id)
  }
},heartbeatTimer)

socket.on('DataToPool', (block, type) => {
	blockPool.push({block: block, type: type});
})

socket.on('heartbeatPing',(leaderID)=>{
  console.log("hello from our leader ("+leaderID+") :D");
  ResetTimer()
  hasLeader = true
  clearTimeout(setBullyTimeout)
  okCounter = false
  voteResult = 0
})


global.addNewTransaction = function(nextData, key) {
    
	const nextBlock = blockchain.main.transactions.generateNewBlock(nextData, key)
	const nextBlockString = JSON.stringify(nextBlock)
	socket.emit('AddDataToPool', nextBlockString, "TRANSACTIONS")
}

global.addNewContract = function(nextData, key) {
	const nextBlock = blockchain.main.contracts.generateNewBlock(nextData, key)
    const nextBlockString = JSON.stringify(nextBlock)
    console.log(nextBlockString);
    
	socket.emit('AddDataToPool', nextBlockString, "CONTRACTS")
}






