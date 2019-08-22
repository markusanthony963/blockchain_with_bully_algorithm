import React, {Component} from 'react';
import { Alert,StyleSheet, Text, View ,Button,TouchableOpacity,TextInput,AsyncStorage,KeyboardAvoidingView } from 'react-native';
const SHA256 = require("crypto-js/sha256")

class Login extends Component{
  state ={
      username :'',
      password:'',
      hashed:''
    };
  componentDidMount() {
    }

  onButtonPressed(){
    console.log("masuk ke testing : "+ this.state.username);
    
    global.testing(this.state.username)
    }

  doLogin= async ()=>{
      if(this.state.username != "" && this.state.password != ""){
        try{
          let login = await AsyncStorage.getItem(global.userKey,(err,res)=>{
            if(!err && res){
              var hashed = SHA256(this.state.username+this.state.password)
              var dataLogin = JSON.parse(res)
              console.log(res);
              console.log("hashed : " + hashed);
            }
            try {
              if(dataLogin[this.state.username].hashed == hashed){
                const userLoggedIn = JSON.stringify(dataLogin[this.state.username])
                AsyncStorage.setItem(global.loggedIn,userLoggedIn)
                global.Login(userLoggedIn)
                this.props.navigation.navigate('Mainmenu')
              }else{
                alert('Username atau Password tidak cocok')
                
              }
            } catch (error) {
                alert(error)
            }
          });
          var user = JSON.parse(login)
          this.setState({hashed:user.hashed, username: user.username})
        }catch(err){
        }
      }else{
        Alert.alert("Mohon lengkapi data!")
      }
    }

  render(){
    return(
        <View style={styles.container}>
        <View style={{flex:0.2,alignItems:'center',justifyContent:'center',marginBottom:20}}>
          <Text style={{fontSize:45,color:'#04B795',fontWeight:'bold'}}>Login Vote Apps</Text>
        </View>
          <View style={{justifyContent:'center',alignItems:'stretch',flexDirection:'column'}}>
            <View style={{height:35,marginHorizontal:20}}>
              <TextInput
                placeholder = 'username'
                style={styles.inputBox}
                onChangeText={(username) => this.setState({username})}
                value = {this.state.username}
                autocomplete = {false}
                autoCapitalize ='none'
                />
            </View>
            <View style={{height:35,marginHorizontal:20,marginVertical:20}}>
              <TextInput
                placeholder = 'password'
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
              onPress={()=>this.doLogin()}
              style={{marginLeft:70,marginEnd:70,flex:1,borderRadius:10,backgroundColor:'#04B795',justifyContent:'center',alignItems:'center'}}
            >
              <Text style={{fontSize:20,fontWeight:'bold',color:'white'}}>Login</Text>
            </TouchableOpacity>
          </View>
          <View style={{height:50}}>
            <TouchableOpacity
              onPress={()=>this.props.navigation.navigate('SignupPage')}
              style={{marginLeft:70,marginEnd:70,borderColor:'black',flex:1,borderWidth:2,borderRadius:10,backgroundColor:'black',justifyContent:'center',alignItems:'center',}}
              >
              <Text style={{fontSize:20,fontWeight:'bold',color:'white'}}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
    )
  }
}


const styles={
  container:{
    flex:1,
    justifyContent:'center'
  },
  textStyle:{
    flex:1,
    fontSize:20,
    justifyContent:'center',
    alignItems:'center',
    textAlign:'center'
  },
  inputBox:{
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

 export default Login
