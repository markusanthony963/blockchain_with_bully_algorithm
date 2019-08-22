// const IP_ADDRESS = "http://192.168.43.221:3000"// tethering hp
// const IP_ADDRESS = "http://192.168.1.11:3000" //rumah
const IP_ADDRESS = "http://192.168.1.2:3000" //rumah

const socket = require('socket.io-client')(IP_ADDRESS);



var hasLeader = false
var isLeader = true
var heartbeatTimer = 5000 //interval pinging heartbeat
var setTimeoutHb
var timeoutHb = 1000 //timer untuk heartbeat
var blokcen =[1,2,3,4]
var RandomTimeout
var doneVoting = false
var point = randomPoin(10)
var leaderTimeout

function Election(){
  socket.emit('beginElection',socket.id)
  // ResetTimer()
}


function firstTime(){
  socket.emit('initialLogin',socket.id,point)
  RandomTimeout = RandomTimeout()
}

function ResetTimer(){
  clearTimeout(setTimeoutHb)
  setTimeoutHb = setTimeout(()=>{
    console.log('LEADER DISCONNECTED! REQUEST NEW ELECTION !!!')
    isLeader=false
    Election()
  },timeoutHb)
}

function randomPoin(max){
  return Math.floor(Math.random()*Math.floor(max))
}

function RandomTimeout() {
	const min = 3000;
	const max = 4000;
  var random = Math.floor(Math.random() * (max - min + 1)) + min;
  return random
}
setInterval(()=>{
  if(isLeader){
    socket.emit('sendHeartbeat',()=>{

    })
  }
},heartbeatTimer)


socket.on('connect', () => {
	console.log("Connected: " + socket.id + " point : "+ socket.point);
  firstTime()
});
socket.on('disconnect', () => {
	console.log("Disconnected");
});


// socket.on('testingPoint',(candidateID,candidatePoint)=>{
//   console.log('candidate point masuk : '+candidatePoint + "ID nya :" + candidateID);
// })
function checkResult(totalOnlineUser,resultArr){

}

socket.on('leaderVoteResult',(candidateID,result)=>{
console.log("NEW LEADER : "+candidateID + "RESULT : "+result);
// setTimeoutHb = setTimeout(()=>{
  // console.log('NEW LEADER ELECTED')
//   isLeader=false
//   Election()
// },timeoutHb)
// isLeader= false
socket.emit("newLeaderElected",candidateID)
console.log('NEW LEADER ELECTED')
heartbeatTimer = 100
// ResetTimer()

})


socket.on('testingPoint',(candidateID,candidatePoint)=>{
  // console.log(socket);
  selfID = socket.id
  selfPoint = point
  console.log("self ID " +selfID + " , " +" self point " + selfPoint+" candidate ID  " +candidateID+"candidate point  " +candidatePoint);

  // console.log(selfID + " , " + selfPoint);
  if(candidatePoint >= selfPoint){
    console.log("voting for :" + candidateID + " true by : "+ selfID);
    socket.emit('voteForCandidate',candidateID,true,selfID)
    doneVoting = true
  }else if(selfPoint > candidatePoint){
    // console.log("voting for :"+ candidateID + "false by : "+ selfID);
    // socket.emit('voteForCandidate',candidateID,true,selfID)
    // doneVoting = true
  }

  // if(candidateID == socket.id){
  //   console.log("IM THE CANDIDATE " +socket.id);
  //   console.log('MY POINT :' +candidatePoint);
  // }else {
  //   console.log("IM NOT THE CANDIDATE , MY POIN : "+ candidatePoint);
  // }
  // console.log("point saya sendiri : "+ selfPoint);
  // console.log('candidate point masuk : '+candidatePoint + "ID nya :" + candidateID);
})


socket.on('heartbeatPing',()=>{
  console.log('pong')
  hasLeader = true
  ResetTimer()
})
// socket.on('beginBully',(candidateID,candidatePoint,selfID,selfPoint,blockchainLength)=>{
//   if(candidateID == selfNodeID){
//     console.log('I AM THE CANDIDATE');
//   }else{
//     console.log('IM NOT THE CANDIDATE');
//   }

  socket.on('beginBully',(candidateID,candidatePoint,selfID,selfPoint)=>{
    if(candidatePoint>selfPoint){
      console.log(candidateID + " adalah new leader");
    }else{
      console.log(selfID+" adalah new leader");
    }
console.log("TERPILIH ===> soket id = " + candidateID)
isLeader=true
})
