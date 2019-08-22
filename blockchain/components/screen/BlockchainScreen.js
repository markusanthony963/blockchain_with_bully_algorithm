import React from 'react'
import { Modal,StyleSheet, Text,FlatList, View, AsyncStorage, TextInput, TouchableOpacity, Alert, Picker } from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';


const color = ['#1104B7', '#A904B7', '#04B795', '#00ffa9']

export default class App extends React.Component{
    constructor(props){
        super(props)
        this.state={
            voteId: "",
            contractDataArr : [],
            contractData:{
                data:{
                    candidates:["","",""],
                }
            },
			transactionCount: 0,
            points: [0, 0, 0],
            modalVisible: false,
            transactions:[],
            limit:0,
            

        }
    }

    componentWillMount(){
        this.getData()
    }
    getData(){
        AsyncStorage.getItem(global.blockchain,(err,res)=>{
            if(!err && res){
                console.log("000000000000000000000000");
                
                console.log(res);
                
                console.log("000000000000000000000000");
                 const contractData = JSON.parse(res).contracts.chain
                 console.log(JSON.stringify(contractData));
                 
                 const transactionData = JSON.parse(res).transactions.chain
                for(var i = 0; i<contractData.length;i++ ){
                    var contractID = contractData[i].data.voteId
                    var str = JSON.stringify(contractID)
                    this.state.contractDataArr.push(contractData[i])
                       
                }
                //Alert.alert("bc", this.state.contractDataArr[1].data.voteId)
            }
        })
    }

    VotingItem = (props)=>(
            <View style={{flex:1,borderWidth:2,borderRadius:30,borderColor:'#CCCCCC'}}>
                <TouchableOpacity 
                    onPress = {()=>{this.selectedVote(props)}}
                    style={{alignItems:'center',justifyContent:"center",flex:1}}>
                    <Text style={{fontFamily:'bold',fontSize:18}}>{`${props.data.voteId}`}</Text>
                </TouchableOpacity>
            </View>
    )
    
    selectedVote(props){
        this.setState({voteId: props.data.voteId})
        if(props.data.voteId == "GENESIS"){
			alert("GENESIS merupakan blok pertama pada Blockchain","GENESIS tidak dapat dipilih")
		}else{
        AsyncStorage.getItem(global.blockchain, (err, res) => {
			if (!err && res) {
				const contractData = JSON.parse(res).contracts.chain
				const transactionList = JSON.parse(res).transactions.chain

				var transactionCount = canPoint1 = canPoint2 = canPoint3 = 0
				var transactions = []
				var ending = false

				for (var x = 0; x < contractData.length; x++) {
					if (contractData[x].data.voteId === props.data.voteId) {
                        this.setState({ contractData: contractData[x] })
                        this.setState({limit : contractData[x].data.limit})
						for (var y = 0; y < transactionList.length; y++) {
							if (transactionList[y].data.voteId === props.data.voteId) {
								transactionCount++
								for (var z = 0; z < contractData[x].data.candidates.length; z++) {
									if (transactionList[y].data.choice == contractData[x].data.candidates[z]) {
										var tempPoint = this.state.points
										tempPoint[z]++
										this.setState({points: tempPoint})
									}
								}
								transactions.push(transactionList[y].data)
							}
						}
						this.setState({
							transactions: transactions.reverse(),
							transactionCount: transactionCount,
						})
						this.toggleModal(true)
						ending = true
						break
					}
				}
				if (!ending) {
					this.showErrorMessage('Vote ID Not Found', 'Please Enter Valid Vote ID')
				}

			} else {
				this.showErrorMessage('Vote ID Not Found', 'Please Enter Valid Vote ID')
			}
		})
    }
    }


	toggleModal(visibility) {
        this.setState({ modalVisible: visibility })
        if(visibility == false){
            this.setState({points: [0,0,0]})
            this.setState({limit : 0})
        }
	}

    progressBar(index,percentage){
        if((percentage/100) === 0){

            return (
                <View 
                key={index}
                style={{
                    borderRadius:5,
                    flex: percentage/100,//(this.state.points[index]/10), 
                    height: 40, 
                    backgroundColor: "#RGBA0000",
                    justifyContent: 'center',
                }} >
                <Text style={styles.percText}>{percentage}%</Text>
            </View>
            )
            
        }else{
            return(
                <View 
                key={index}
                style={{
                    borderRadius:5,
                    flex: percentage/100,//(this.state.points[index]/10), 
                    height: 40, 
                    backgroundColor: color[index],
                    justifyContent: 'center',
                }} >
                <Text style={styles.percText}>{percentage}%</Text>
            </View>
            )
        }
    }

    render(){
        return(
            <View style={styles.container}>
            <Modal
					animationType="slide"
					transparent={false}
					visible={this.state.modalVisible}
					onRequestClose={() => { this.toggleModal(false) }}>
					
					<View style={styles.containerRowTop}>
						<View style={{alignItems: 'flex-start', justifyContent: 'center', flex:0.5}}>
							<TouchableOpacity
							onPress={() => { this.toggleModal(false) }}>
								<Icon name="chevron-left" size={40} color="black" style={{margin: 5}}/>
						</TouchableOpacity>
						</View>
                        <View style={{justifyContent:"center",alignContent:'center'}}>
                            <Text style={{fontWeight:'bold',fontSize:30,color:'black'}}>{this.state.voteId} </Text>
                        </View>

					</View>
					<View style={styles.containerRow}>
						{
							this.state.contractData.data.candidates.map((data, index) => {
                                var percentage = (this.state.points[index]/this.state.limit)*100
                                console.log(percentage);
                                console.log(this.state.limit);
                                
                                
								return (
                                    <View style={{flex:0.1,marginTop:20,marginHorizontal:10,}}>
                                        <View style={{flexDirection:'row',justifyContent:"space-between"}}>
                                            <Text style={{fontSize:20,fontWeight:'bold'}}>{data}</Text>    
                                            <Text style={{fontSize:20,fontWeight:'bold'}}>{this.state.points[index]} / {this.state.limit}</Text>
                                        </View>
                                        <View style={{height:40,backgroundColor:'#ada8a3',alignItems:'center',flexDirection:'row',borderRadius:5}}>
                                            {
                                                this.progressBar(index,percentage)
                                            }
                                        </View>
                                    </View>
								)
								
							})
						}
						
					</View>
				</Modal>
                    <View style={{justifyContent:'flex-start',alignItems:'center',flex:0.1}}>
                        <Text style={{fontFamily:'bold',fontSize:30,color:'black',marginTop:10}}>Pilih Campaign</Text>
                    </View>
                    <View style = {{flex:0.9,justifyContent:'flex-start',alignItems:'stretch'}}>
                    <FlatList
                            data = {this.state.contractDataArr}
                            keyExtractor = { item => item}
                            renderItem = {({item})=>(
                                <View style={{flex:1,marginHorizontal:10,marginBottom:10,height:80}}>
                                    <this.VotingItem {...item}/>
                                </View>
                             )}
                        />
                    </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'stretch',
		justifyContent: 'flex-start',

	},
	containerHalf: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	textInput: {
		height: 40,
		width: '70%',
		marginTop: 10,
		paddingHorizontal: 10,
		backgroundColor: '#FFF'
	},
	half: {
		height: 40,
		width: '33%',
		marginLeft: 7,
		marginRight: 7,
		marginTop: 10,
		paddingHorizontal: 10,
	},
	halfText: {
		height: 40,
		width: '33%',
		marginLeft: 7,
		marginRight: 7,
		marginTop: 10,
		paddingHorizontal: 10,
		alignItems: 'center',
		justifyContent: 'center'
	},
	textInputHalf: {
		height: 40,
		width: '33%',
		marginLeft: 7,
		marginRight: 7,
		marginTop: 10,
		paddingHorizontal: 10,
		backgroundColor: '#FFF'
	},
	submitButton: {
		height: 40,
		width: '70%',
		marginTop: 10,
		backgroundColor: '#b1d8e0',
		alignItems: 'center',
		justifyContent: 'center'
    },
    containerRow: {
        flex:1,
        justifyContent:'flex-start',
	},
	containerRowTop: {
		flexDirection: 'row',
		borderWidth: 1,
	    borderRadius: 3,
	    borderColor: '#ddd',
	    borderBottomWidth: 0,
	    shadowColor: '#000',
	    shadowOffset: { width: 0, height: 2 },
	    shadowOpacity: 2,
	    shadowRadius: 2,
	    elevation: 1,
	},
	textInput: {
		height: 40,
		width: '70%',
		marginTop: 10,
		paddingHorizontal: 10,
		backgroundColor: '#FFF'
	},
	submitButton: {
		height: 40,
		width: '70%',
		marginTop: 10,
		backgroundColor: '#b1d8e0',
		alignItems: 'center',
		justifyContent: 'center'
	},
	sectionBack: {
		flex: 1,
		backgroundColor: '#FFF',
		marginTop: 20,
		height: 40,
		width: '70%',
		borderWidth: 0.7,
		borderColor: '#000',
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center'
	},
	sectionItem: {
		alignSelf: 'stretch',
		fontSize: 18,
		textAlign: 'center',

	},
	headerText: {
		fontSize: 18,
		textAlign: 'center'
	},
	percText: {
		fontSize: 18,
		marginLeft: 5,
        marginRight: 5,
        color:'white',
        fontWeight:'bold',
        paddingLeft:5
	}
});
