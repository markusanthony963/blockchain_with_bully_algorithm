import React, {Component} from 'react';
import { Alert,StyleSheet, Text, View ,Button,TouchableOpacity,TextInput,AsyncStorage } from 'react-native';
const SHA256 = require("crypto-js/sha256")
const hex = require("crypto-js/enc-hex")


class SignupPage extends Component{
  state ={
      username :'',
      password:'',
      errorMessage:null,
    };
  generatePrivateKey(){
    var charset = "abcdefg123456"
    var privKey = ""
    const timeStamp = Math.floor(Date.now());
    for(var i = 0 ; i<32; i++)
      privKey = privKey + charset[Math.floor(Math.random() * charset.length)];
      privKey = privKey + this.state.password + timeStamp
    console.log("private key : "+ privKey);
    
    return privKey
  }

  doSignUp(){
    if(this.state.username != "" && this.state.password != ""){
      var newArr = {}
      var hashed = SHA256(this.state.username+this.state.password).toString()
      var user={
        privateKey: this.generatePrivateKey(),
        hashed:hashed
      }

      AsyncStorage.getItem(global.userKey,(err , res)=>{
        if(!err && res){
          console.log("res : " + res);
            newArr = JSON.parse(res)
        }
        if(newArr[this.state.username] == null){
            newArr[this.state.username] = user 
            var newStr = JSON.stringify(newArr)
            AsyncStorage.setItem(global.userKey,newStr,()=>{
              Alert.alert("Succes!", "ID " + this.state.username + " created !")
            })
        }else{
          Alert.alert("Username Telah Terpakai!")
        }
      })
    }else{
      Alert.alert("","Mohon lengkapi data!")
    }
  }

  render(){
    return(
        <View style={styles.container}>
          <View style={{justifyContent:'center',alignItems:'stretch',flexDirection:'column',flex:0.3}}>
            <View style={{height:35,marginBottom:20,marginHorizontal:20}}>
              <TextInput
                placeholder = 'Username'
                style={styles.inputBox}
                onChangeText={(username) => this.setState({username})}
                value = {this.state.username}
                autocomplete = {false}
                autoCapitalize ='none'
                />
            </View>
            <View style={{height:35,marginHorizontal:20}}>
              <TextInput
                placeholder = 'Password'
                style={styles.inputBox}
                onChangeText ={(password) => this.setState({password})}
                value = {this.state.password}
                secureTextEntry = {true}
                autocomplete = {false}
                autoCapitalize ='none'
                />
              </View>
          </View>
          <View style={{height:50,marginBottom:10,marginTop:50}}>
            <TouchableOpacity
                 style={{marginLeft:70,marginEnd:70,borderColor:'black',flex:1,borderWidth:2,borderRadius:10,backgroundColor:'black',justifyContent:'center',alignItems:'center',}}
                 onPress={()=>this.doSignUp()}
            >
              <Text style={{fontSize:20,fontWeight:'bold',color:'white'}}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
    )
  }
}


const styles={
  container:{
    justifyContent:'center',
    flex:1
  },
  textStyle:{
    flex:0.1,
    fontSize:20,
    justifyContent:'center',
    alignItems:'center',
    textAlign:'center'
  },
  inputBox:{
    flex:1,
    paddingLeft:5,
    paddingRight:5,
    borderWidth:2,
    borderRadius:10,
    borderColor:'black',
    justifyContent:'center',
    alignItems:'center',
    textAlign:'center'
  }
}

 export default SignupPage
