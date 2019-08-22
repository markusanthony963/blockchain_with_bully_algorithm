var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http)

var onlineUser = []
var jumlahUser = 0
var leaderID = ''
var users = {}


io.on('connection',(socket)=>{
    console.log("user connected")

    jumlahUser++
    onlineUser[socket.id]={
      socket: socket,
    }
    users[socket.id] = socket

    socket.on('connectedUsersRequest' , (targetID) => {
        users[targetID].emit('connectedUsersResponse', jumlahUser)
    })


    socket.on('initialLogin',(newUserId,newUserPoint,newUserTimestamp,newUserTimestampString)=>{
        io.emit('newUserLogin',newUserId,newUserPoint,newUserTimestamp,newUserTimestampString)
    })

    socket.on('phonebookSync',(targetID,latestLeaderPhonebook)=>{
        io.emit('syncingPhonebook',latestLeaderPhonebook)

    })
    socket.on('beginElection',(targetUser,from,)=>{
        if(users[targetUser] != undefined){
            users[targetUser].emit('bullyElection',from)
        }     
     })
    socket.on('sendAnswer',(okTo, from)=>{
        users[okTo].emit('okAnswer',from)
    })
    socket.on("newLeader",(candidateID)=>{
      io.emit('leaderVoteResult', candidateID, true)
    })
    socket.on("leaderElected",(newLeaderID)=>{
        leaderID = newLeaderID
    })
    socket.on('voteForCandidate',(candidateID,result,voterID)=>{
      users[candidateID].emit('leaderVoteResult',candidateID,result,jumlahUser)
    })
    socket.on('disconnect',()=>{
      leaderPoin = 0
      console.log("user disconnected")
        io.emit('disconnectedUser',socket.id)
        console.log(socket.id + "removed");
        delete users[socket.id]

      jumlahUser--
      })
    socket.on('sendHeartbeat',(leaderID,phoneBook)=>{
      console.log(leaderID + ' say : "ping"');
      socket.broadcast.emit('heartbeatPing',leaderID,phoneBook)
    })
    socket.on('AddDataToPool', (nextBlock, type) => {
      console.log(nextBlock)
      console.log(type)
		    io.emit('DataToPool', nextBlock, type);
      })
      socket.on('ProcessPool', (block, type) => {
		io.emit('DataToVote', block, type);
    })
    socket.on('VoteForData', (result) => {
		if(users[leaderID] != undefined) {
			users[leaderID].emit('DataVoteResult', result, jumlahUser)
		}
    })
    socket.on('CommitData', (pool, type) => {
        if(users[leaderID] != undefined) {
        console.log("commiting data : " + pool);
        io.emit('DataToCommit', pool, type,users[leaderID]);
        }
    })
    socket.on('RemoveData', () => {
        console.log("remove data ");
        io.emit('DataToRemove');
    })
    socket.on('DoneAdding',(leaderID,nodeID)=>{
        if(users[leaderID] != undefined){
            users[leaderID].emit('UpdatePoint',nodeID)
            console.log(nodeID + "done adding block");   
        }
        
    })  
      socket.on('RequestSync',(userID)=>{
        console.log(userID + " request syncing");
            if(users[leaderID] != undefined){
                users[leaderID].emit('SyncRequest',userID)
            }
      })
      socket.on('SendSync',(chain,pool,userID)=>{
          if(users[userID] != undefined){
              users[userID].emit('SyncListener',chain,pool)
          }
      })
})

http.listen(3000, function(){
  console.log('listening on *:3000');
});
