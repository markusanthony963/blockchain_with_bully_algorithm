/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */
import { sha256 } from 'react-native-sha256';
import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View,Button,TextInput} from 'react-native';
import  {createStackNavigator,createAppContainer}   from 'react-navigation';
import LoginPage from './components/screen/LoginPage';
import SignupPage from './components/screen/SignupPage';
import Mainmenu from './components/screen/Mainmenu';
import NewVotingPage from './components/screen/NewVotingPage'
import VotingPage from './components/screen/VotingPage'
import BlockchainScreen from './components/screen/BlockchainScreen'

import './utility/GlobalItem'
import './jsFiles/NewConsensus'
const SHA256 = require("crypto-js/sha256")
console.disableYellowBox = true;
const Route = createStackNavigator({
  LoginPage :{
    screen: LoginPage,
    navigationOptions: {
      title: 'LoginForm',
      header:null,
    },
  },
  SignupPage :{
    screen: SignupPage,
    navigationOptions: {
      title: 'SIGN UP',
      },
  },
  Mainmenu :{
    screen: Mainmenu,
    navigationOptions: {
      title: 'Menu',
      header:null
      },
  },
  NewVotingPage :{
    screen: NewVotingPage,
    navigationOptions: {
      title: 'Buat Voting Baru',
      },
  },
  VotingPage :{
    screen: VotingPage,
    navigationOptions: {
      title: 'Vote',
      },
  },
  BlockchainScreen :{
    screen: BlockchainScreen,
    navigationOptions: {
      title: 'Hasil Voting',
      //header:null,
    },
  },
  
})


const routeApp = createAppContainer(Route);


class App extends Component<Props> {

  state={
    hashed:'',
    data:''
  }

  PrintSHA(){
      sha256(this.state.data).then( hash => {
      console.log(hash);
      this.setState({hashed:hash})
  })
  }
  Sha(){
    this.setState({hashed:SHA256(this.state.data)})

      console.log(SHA256(this.state.data));
  }

  render() {
    console.log("data:" +this.state.data);
    return (
      <View style={styles.container}>
      <View style={{borderWidth:1,justifyContent:'center',alignItems:'center'}}>
        <TextInput
          style={{alignItems:'stretch'}}
          placeholder="data"
          onChangeText ={(data) => this.setState({data})}
        />
      </View>
      <View>
        <Button
          title="Add New Block"
          onPress={this.Sha}
        />
      </View>
        <Text>{this.state.hashed}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

export default routeApp
