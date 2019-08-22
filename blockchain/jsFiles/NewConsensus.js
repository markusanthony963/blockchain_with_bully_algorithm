import {AsyncStorage} from 'react-native';
const IP_ADDRESS =  global.IP_ADDRESS
const socket = require('socket.io-client')(IP_ADDRESS);
const Blockchain = require('./Blockchain')
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

var blockchain = new Blockchain()
var hasLeader = false
var isLeader = false
var heartbeatTimer = 300
var setTimeoutHb , setBullyTimeout, setOkTimeout
var bullyTimeout = 1000
var timeoutHb = RandomTimeout()
var blockPool = [] 
var isPooling = false
var currentPoolData = ""
var currentPoolType = ""
var dataVoteResult = []
var setTimeoutProcess
var connectedUser = []
var connectedUserStr = ""
var selfPublicKey = ""
var point = 0

global.isConnected = false
var timeStampString 

var theDate = new Date(timeStamp * 1000);
timeStampString = theDate.toUTCString();
var timeoutSyncing
var isFirstTimeSynced = false 
var timeStamp = Date.now() 

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


socket.on('connectedUsersResponse', (jumlahUser) => {
    if (jumlahUser == 1) {
      socket.emit('newLeader',socket.id)
    }
  })
socket.on('connect', () => {
  console.log("Connected!");

});


function getTime(){
    var date = new Date().getDate(); //Current Date
    var month = new Date().getMonth() + 1; //Current Month
    var year = new Date().getFullYear(); //Current Year
    var hours = new Date().getHours(); //Current Hours
    var min = new Date().getMinutes(); //Current Minutes
    var sec = new Date().getSeconds(); //Current Seconds
    timeStampString = date + "-"+month+"-"+year+" "+hours+":"+min+":"+sec
  }

function firstTime(){
  getTime()
  global.isConnected = true
  console.log('ID = ' + socket.id);
  console.log('POINT = ' + point);
  console.log('timestamp = '+timeStamp);
  socket.emit('initialLogin', socket.id, point,timeStamp,timeStampString)
  
  AsyncStorage.getItem(global.blockchain, (err,res)=>{
      if(!err && res){
          const storedBlockchain = JSON.parse(res)
          const transactionsLength = blockchain.getTransactionsLength()
          const contractsLength = blockchain.getContractsLength()
          blockchain.main.transactions.replaceChain(storedBlockchain.transactions)
          blockchain.main.contracts.replaceChain(storedBlockchain.contracts)
          console.log("transaction length : " + blockchain.getTransactionsLength() );
          console.log('POINT = ' + point);
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
      }, 700)
  })
  ResetTimer()
  resetPoolTimeout()
  
}


socket.on('newUserLogin',(newUserId,newUserPoint,timeStamp,timeStampString)=>{
    var userObj = {
        socketID : newUserId,
        socketPoint : newUserPoint,
        socketTimeStamp : timeStamp,
        socketTimeStampString : timeStampString
    }
    connectedUser.push(userObj)
    console.log("connected user : " + connectedUser.length);
    console.table(connectedUser);
    connectedUserStr = JSON.stringify(connectedUser)
    if(isLeader){
     socket.emit('phonebookSync',connectedUserStr) 
    }
  })

socket.on('syncingPhonebook',(latestPhonebookFromLeader)=>{
    connectedUser = JSON.parse(latestPhonebookFromLeader)
    console.log("end of syncying phonebook");
    console.table(connectedUser)
  })

    
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
      hasLeader = false
        console.log(socket.id);
        console.log('REQUEST NEW ELECTION !!!')
        socket.emit('connectedUsersRequest', socket.id)
        Election()
    },timeoutHb)
  }

function RandomTimeout() {
	const min = 700;
	const max = 1000;
  var random = Math.floor(Math.random() * (max - min + 1)) + min;
  return random
}

function bullyTimer(){
    clearTimeout(setBullyTimeout)
    setBullyTimeout = setTimeout(()=>{
    socket.emit('newLeader',socket.id)
    }, 500)
    
  }

socket.on('bullyElection',(from)=>{
    console.log("received bully election from :" + from)
    startingElection = true
    if(startingElection == false){
      if (from != socket.id) {
        Election()
      }
    }
    socket.emit('sendAnswer',from,socket.id)
  })

function Election(){
    let isHighest = point
    let latest = 0
    let bigestPoint = true
    let len = 0
    for (var i = 0; i < connectedUser.length; i++) {
      if (connectedUser[i] !== undefined) {
        len++;
      }
    }
    if(len > 1){
  
      for(var i = 0; i<connectedUser.length;i++){
  
        if(connectedUser[i].socketID != socket.id && !hasLeader) {
  
          var targetUser = connectedUser[i].socketID
  
          if (connectedUser[i].socketPoint > point) {
            isHighest = connectedUser[i].socketPoint
            console.log('send to : '+ connectedUser[i].socketID );
            socket.emit('beginElection' ,targetUser,socket.id)
            bullyTimer()
            bigestPoint = false;
          } else if (connectedUser[i].socketPoint == point && connectedUser[i].socketTimeStamp < timeStamp) {
            latest = connectedUser[i].socketTimeStamp
            console.log('send to : '+ connectedUser[i].socketID );
            socket.emit('beginElection' ,targetUser,socket.id)
            bullyTimer()
            bigestPoint = false
          }else {
            console.log("ooooo");
            console.log(connectedUser[i].socketID);
            console.log("ooooo");
            
            if(point >= isHighest) {
              isHighest = point       
            }
            if(timeStamp <= latest){
              console.log("timestamp dari  : " + connectedUser[i].socketID);
              
              latest = timeStamp
            }
          }
        }
      }
        if (point == isHighest) {
          if( timeStamp <= latest ){
            console.log("masuk ga nih");
            socket.emit('newLeader',socket.id)
          }else if (bigestPoint == true){
            console.log("poss");
            socket.emit('newLeader',socket.id)
          }
      }else if(point > isHighest){
        socket.emit('newLeader',socket.id)
      }
    }else{
      console.log(connectedUser.length);
      
      console.log("sendirian");
      
      socket.emit('newLeader',socket.id)
    }
  }


socket.on('okAnswer',(from)=>{
    okCounter = true
    waitingForLeaderTimeout()
    console.log('ok from : ' + from);
  
  })


function waitingForLeaderTimeout(){
    clearTimeout(setBullyTimeout)
    clearTimeout(setOkTimeout)
      setOkTimeout = setTimeout(()=>{
          socket.emit("newLeader",socket.id)
          console.log('ada oke tapi gaada new leader');
      },bullyTimeout)
  }

let tempLeaderId
socket.on('leaderVoteResult',(leaderID, result)=>{
    if (result && tempLeaderId != leaderID) {
      tempLeaderId = leaderID
      console.log("NEW LEADER : "+leaderID );
      console.log('NEW LEADER ELECTED')
    }
    if (socket.id == leaderID) {
      isLeader = true
    } else {
      isLeader = false
    }
   hasLeaderM()
  })


  function hasLeaderM() {
    hasLeader = true
    clearTimeout(setTimeoutHb)
    clearTimeout(setBullyTimeout)
    clearTimeout(setOkTimeout)
    startingElection = false
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

socket.on('DataToVote', (block, type) => { 
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

//
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
socket.on('DataToCommit', (pool, type,leaderID) => { 
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
    socket.emit("DoneAdding",socket.id)
    console.log('start add new point');
    
});
    socket.on('UpdatePoint',(nodeID)=>{
    for(var i = 0;i<connectedUser.length;i++){
        if(connectedUser[i].socketID == nodeID){
            connectedUser[i].socketPoint = connectedUser[i].socketPoint + 1
        }
    }
    connectedUserStr = JSON.stringify(connectedUser)
    if(isLeader){
     socket.emit('phonebookSync',connectedUserStr)
     console.log("done syncing");
      
    }
    
})
setInterval(()=>{
    if(isLeader){
      socket.emit('sendHeartbeat',socket.id,connectedUserStr)
    }
  },heartbeatTimer)

socket.on('DataToPool', (block, type) => {
	blockPool.push({block: block, type: type});
})

socket.on('heartbeatPing',(leaderID,phoneBook)=>{
    
    connectedUser = JSON.parse(phoneBook)
    ResetTimer()
    hasLeader = true
    clearTimeout(setBullyTimeout)
    clearTimeout(setOkTimeout)
    okCounter = false
  })
  
function checkPoint(){
    AsyncStorage.getItem(global.blockchain, (err,res)=>{
        if(!err && res){
           const transaction = JSON.parse(res).transactions.chain
           var pointCounter = 0
            for(var i = 0 ; i<transaction.length;i++){
                var senderIDObj = transaction[i].sender
                var senderIDStr = JSON.stringify(senderIDObj)
                if(senderIDStr == '"'+selfPublicKey+'"'){
                    pointCounter++
                    point = pointCounter
                }
            }
            console.log("POINT after sync : " + point);   
        }
    })
}

global.testing = function(msg){
    console.log("ini testing: "+ msg);
    
    socket.emit("testing",msg)
}

global.addNewTransaction = function(nextData, key) {
    console.log("==============================");
    console.log("new transaction !!!!!");
    console.log("ini nexData : " + nextData)
    console.log("ini key : " + key)
    
    console.log("==============================");
    
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

global.Login = function(userData){
    firstTime()
    var objUserData = JSON.parse(userData)
    console.log("user data login");
    var key = ec.keyFromPrivate(objUserData.privateKey,'hex')
    selfPublicKey = key.getPublic().encode('hex')
    console.log("public key : " + selfPublicKey);
}
