const IP_ADDRESS = "http://192.168.1.1:3000"
const socket = require('socket.io-client')(IP_ADDRESS);
var hasLeader = false
var isLeader = false
var heartbeatTimer = 300
var setTimeoutHb , setBullyTimeout, setOkTimeout
var bullyTimeout = 1000
var timeoutHb = RandomTimeout()
var point = randomPoin(10)
var okCounter = false
var connectedUser = []
var connectedUserStr = ""
var timeStamp = Date.now() 
var timeStampString 
var _ = require('lodash');
var startingElection = false
var theDate = new Date(timeStamp * 1000);
timeStampString = theDate.toUTCString();

socket.on('connect', () => {
  console.log("Connected!");
  firstTime()
});

socket.on('connectedUsersResponse', (jumlahUser) => {
  if (jumlahUser == 1) {
    socket.emit('newLeader',socket.id)
  }
})
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
   socket.emit('phonebookSync',newUserId,connectedUserStr) 
  }
})
socket.on('syncingPhonebook',(latestPhonebookFromLeader)=>{
  connectedUser = JSON.parse(latestPhonebookFromLeader)
  console.log("end of syncying phonebook");
  console.table(connectedUser)
})
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
  socket.emit('initialLogin', socket.id, point,timeStamp,timeStampString)
  console.log('ID = ' + socket.id);
  console.log('POINT = ' + point);
  ResetTimer()
}
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
	const min = 400;//275
	const max = 600;//301
  var random = Math.floor(Math.random() * (max - min + 1)) + min;
  return random
}
function waitingForLeaderTimeout(){
  clearTimeout(setBullyTimeout)
  clearTimeout(setOkTimeout)
    setOkTimeout = setTimeout(()=>{
        socket.emit("newLeader",socket.id)
        console.log('ada oke tapi gaada new leader');
    },bullyTimeout)
}

socket.on('disconnectedUser',(dcUser)=>{
  console.log("delete "+ "\`"+dcUser+"\`");
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
socket.on('okAnswer',(from)=>{
  okCounter = true
  waitingForLeaderTimeout()
  console.log('ok from : ' + from);

})

function bullyTimer(){
  clearTimeout(setBullyTimeout)
  setBullyTimeout = setTimeout(()=>{
  socket.emit('newLeader',socket.id)
  }, 500)
  
}

let tempLeaderId
socket.on('leaderVoteResult',(leaderID, result)=>{
  if (result && tempLeaderId != leaderID) {
    tempLeaderId = leaderID
    console.log("NEW LEADER : "+leaderID );
    console.log('NEW LEADER ELECTED')
    console.log('My socket id :' + socket.id);
    
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

function randomPoin(max){
  return Math.floor(Math.random()*Math.floor(max))
}


setInterval(()=>{
  if(isLeader){
    socket.emit('sendHeartbeat',socket.id,connectedUserStr)
  }
},heartbeatTimer)

socket.on('heartbeatPing',(leaderID,phoneBook)=>{
  connectedUser = JSON.parse(phoneBook)
  ResetTimer()
  hasLeader = true
  clearTimeout(setBullyTimeout)
  clearTimeout(setOkTimeout)
  okCounter = false
})
