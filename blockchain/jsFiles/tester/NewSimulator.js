import {AsyncStorage} from 'react-native';
const IP_ADDRESS = global.IP_ADDRESS
const socket = require('socket.io-client')(IP_ADDRESS);
const Blockchain = require('./Blockchain')

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
var blockpool = [] 

var timeoutSyncing
var isFirstTimeSynced = false 

var timeStamp = Math.floor(Date.now());
socket.on('connect', () => {
  console.log("Connected!");
  firstTime()
});

function firstTime(){
  console.log('ID = ' + socket.id);
  console.log('POINT = ' + point);
  console.log('timestamp = '+timeStamp);
  ResetTimer()
  
  AsyncStorage.getItem(global.blockchain, (err,res)=>{
      if(!err && res){
          const storedBlockchain = JSON.parse(res)
          blockchain.main.transactions.replaceChain(storedBlockchain.transactions)
          blockchain.main.contracts.replaceChain(storedBlockchain.contracts)
          console.log("success get blockchain");
          console.log(blockchain.main.transactions);
          
      }
      timeoutSyncing = setInterval(()=>{
          if(hasLeader && !isFirstTimeSynced){
              socket.emit('RequestSync', socket.id)
          }
      }, 500)
  })
}

socket.on('SyncRequest',(userID)=>{
    const lastData = JSON.stringify(blockchain.main)
    socket.emit('SendSync',lastData,JSON.stringify(blockpool),userID )

})
socket.on('SyncListener',(chain,pool)=>{
    const newBlockchain = JSON.parse(chain)
    blockpool = JSON.parse(pool)

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
        //leader kepilih
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
  timeoutHb = RandomTimeout()
}

function randomPoin(max){
  return Math.floor(Math.random()*Math.floor(max))
}

socket.on('disconnect', () => {
})

setInterval(()=>{
  if(isLeader){
    socket.emit('sendHeartbeat',socket.id)
  }
},heartbeatTimer)


socket.on('heartbeatPing',(leaderID)=>{
  // console.log('pong')
  console.log("hello from our leader ("+leaderID+") :D");
  ResetTimer()
  clearTimeout(setBullyTimeout)
  okCounter = false
  voteResult = 0
})
