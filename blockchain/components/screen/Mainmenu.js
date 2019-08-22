import React,{Component} from 'react'
import {View,Text,AsyncStorage,TouchableOpacity,StyleSheet} from 'react-native'
import { NavigationActions ,StackActions} from 'react-navigation';

class Mainmenu extends Component{

  logOut(){
    const resetAction = StackActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName: 'LoginPage' })],
  });
  this.props.navigation.dispatch(resetAction);
  }
  render(){
    return(
      <View style={{flex:1,justifyContent:"space-between"}}>
        <View style={{flex:0.2,alignItems:'center',justifyContent:'center'}}>
          <Text style={{fontSize:45,color:'#04B795',fontWeight:'bold'}}>Vote Apps</Text>
        </View>
        <View style={{flex:0.4,justifyContent:'space-between'}}>
          <View style={{flex:0.3,backgroundColor:'#1104B7',borderRadius:10,marginHorizontal:20}}>
            <TouchableOpacity
              onPress={()=>this.props.navigation.navigate('NewVotingPage')}
              style={{flex:1,justifyContent:'center',alignItems:'center'}}
            >
              <Text style={{color:'white',fontSize:20,fontWeight:'bold'}}> Buat voting baru</Text>
            </TouchableOpacity>
          </View>
          <View style={{flex:0.3,backgroundColor:'#A904B7',borderRadius:10,marginHorizontal:20}}>
            <TouchableOpacity
              onPress={()=>this.props.navigation.navigate('VotingPage')}
              style={{flex:1,justifyContent:'center',alignItems:'center'}}
            >
              <Text style={{color:'white',fontSize:20,fontWeight:'bold'}}>Ikuti Voting</Text>
            </TouchableOpacity>
          </View>
          <View style={{flex:0.3,backgroundColor:'#04B795',borderRadius:10,marginHorizontal:20}}>
            <TouchableOpacity
              onPress={()=>this.props.navigation.navigate('BlockchainScreen')}
              style={{flex:1,justifyContent:'center',alignItems:'center'}}
            >
              <Text style={{color:'white',fontSize:20,fontWeight:'bold'}}>Hasil Voting</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{flex:0.3,justifyContent:'flex-end',marginBottom:20}}>
          <View style={{flex:0.3,borderRadius:10,marginHorizontal:20,borderWidth:1}}>
              <TouchableOpacity
                onPress={()=>this.logOut()}
                style={{flex:1,justifyContent:'center',alignItems:'center'}}
              >
                <Text style={{fontSize:20,fontWeight:'bold'}}>Keluar</Text>
              </TouchableOpacity>
            </View>
        </View>
      </View>
    )
  }
}
export default Mainmenu
