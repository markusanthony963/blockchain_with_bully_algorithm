import React from 'react';
import { Modal, StyleSheet, Text, View, AsyncStorage,FlatList, TextInput, TouchableHighlight, TouchableOpacity, Button, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';

const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			contractDataArr : [],
            contractData:{
                data:{
                    voteId:"",
                    candidates:["","",""],
                }
            },
			voteId: "",
			voteData: {
				candidates: [],
				limit: "",
				voteId: ""
			},
			modalVisible: false,
			myChoice:""
		}
	}
	componentWillMount(){
        this.getData()
    }
    getData(){
        AsyncStorage.getItem(global.blockchain,(err,res)=>{
            if(!err && res){
                 const contractData = JSON.parse(res).contracts.chain
                 console.log(JSON.stringify(contractData));
                 
                 const transactionData = JSON.parse(res).transactions.chain
                for(var i = 0; i<contractData.length;i++ ){
                    var contractID = contractData[i].data.voteId
                    var str = JSON.stringify(contractID)
                    this.state.contractDataArr.push(contractData[i])
                       
                }
            }
        })
    }

	toggleModal(visibility) {
		this.setState({	myChoice : ""})
		this.setState({ modalVisible: visibility })
	}

	showErrorMessage(title, message) {
		Alert.alert(title, message)
	}

	voteButtonTapped() {
		AsyncStorage.getItem(global.loggedIn, (err, res) => {
			if (!err && res) {
				const data = JSON.parse(res)
				const votingData = {
					voteId: this.state.voteData.voteId,
					choice: this.state.myChoice
				}

				AsyncStorage.getItem(global.blockchain, (err, res) => {
					if (!err && res) {
						const contractData = JSON.parse(res).contracts.chain
						const transactionList = JSON.parse(res).transactions.chain

						var transactionCount = 0;
						var voted = false

						for (var x = 0; x < contractData.length; x++) {
							console.log("5");
			
							if (contractData[x].data.voteId == this.state.voteId) {
								for (var y = 0; y < transactionList.length; y++) {
									if (transactionList[y].data.voteId == this.state.voteId) {
										transactionCount++
										if (transactionList[y].sender == ec.keyFromPrivate(data.privateKey, 'hex').getPublic().encode('hex')) {
											voted = true
										}
									}
								}
								if (!voted) {
									if (transactionCount >= contractData[x].data.limit) {
										this.showErrorMessage('Campaign telah penuh')
									} else {
										if (global.isConnected) {
											var dat = JSON.stringify(votingData)
											var key = JSON.stringify(data)
											this.showErrorMessage('Voting berhasil!')
											global.addNewTransaction(votingData, data.privateKey)
											this.setState({ modalVisible: false })
										} else {
											this.showErrorMessage('Tidak Tersambung Pada Sistem', 'Mohon Periksa Koneksi Jaringan')
										}
									}
								} else {
									this.showErrorMessage('Anda tidak bisa mengikuti campaign ini', 'Anda sudah pernah berpartisipasi dalam campaign ini')
								}
								break
							}
						}
					} else {
						this.showErrorMessage('Vote ID Not Found', 'Please Enter Valid Vote ID')
					}
				})
			} else {
				this.showErrorMessage('No Internet Connection', 'Please Check Your Internet Connection')
			}
		})
	}
	submitButtonTapped(voteID) {
		this.setState({voteId : voteID})
		if(voteID == "GENESIS"){
			alert("GENESIS merupakan blok pertama pada Blockchain","GENESIS tidak dapat dipilih")
		}else{
		AsyncStorage.getItem(global.blockchain, (err, res) => {
			if (!err && res) {
				
				const contractData = JSON.parse(res).contracts.chain
				const transactionList = JSON.parse(res).transactions.chain
				const stringContract = JSON.stringify(contractData)
				const stringTransaction = JSON.stringify(transactionList)
				var transactionCount = 0;
				var ending = false
				var voted = false
				AsyncStorage.getItem(global.loggedIn, (err, res) => {
					if (!err && res) {
						
						const data = JSON.parse(res)
						for (var x = 0; x < contractData.length; x++) {

							if (contractData[x].data.voteId === voteID) {

								for (var y = 0; y < transactionList.length; y++) {

									if (transactionList[y].data.voteId === voteID) {
										console.log(y);
										
										transactionCount++
										if (transactionList[y].sender == ec.keyFromPrivate(data.privateKey, 'hex').getPublic().encode('hex')) {
											voted = true
											ending = true
											break
										}
									}
								}

								if (voted) {
									this.showErrorMessage('Anda tidak bisa mengikuti campaign ini', 'Anda sudah pernah berpartisipasi dalam campaign ini')
								} else {
									if (transactionCount >= contractData[x].data.limit) {
										this.showErrorMessage('Campaign telah penuh')
									} else {
										this.setState({ voteData: contractData[x].data })
										this.toggleModal(true)
									}
									ending = true
								}
								break
							}
						}
						if (!ending) {
							this.showErrorMessage('Vote ID Not Found', 'Please Enter Valid Vote ID')
						}
					} else {
						this.showErrorMessage('Tidak Tersambung Pada Sistem', 'Mohon Periksa Koneksi Jaringan')
					}
				})

			} else {
				this.showErrorMessage('Vote ID Not Found', 'Please Enter Valid Vote ID')
			}
		})
	}
	}

	showConfirmButton() {
		if (this.state.myChoice == "") {
			this.showErrorMessage('Anda belum memilih opsi', 'Mohon pilih opsi terlebih dahulu')
		} else {
			const chooseString = "Apakah anda yakin dengan pilihan anda ? " + this.state.myChoice
			Alert.alert('Vote Confirmation', chooseString,
			[
				{text: 'Tidak', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
				{text: 'Ya', onPress: () => this.voteButtonTapped() }
			],
			{ cancelable: false } )
		}

	}


    VotingItem = (props)=>(
		<View style={{flex:1,borderWidth:2,borderRadius:30,justifyContent:'center',alignItems:'stretch',borderColor:'#CCCCCC'}}>
			<TouchableOpacity
				style={{flex:1,justifyContent:'center',alignItems:'center'}}
				onPress={() => { this.submitButtonTapped(props.data.voteId) }}
				>
				<Text style={{fontFamily:'bold',fontSize:18}}>{`${props.data.voteId}`}</Text>
			</TouchableOpacity>
		</View>
)

	render() {

		return (
			<View style={styles.container}>
					<View style={{justifyContent:'flex-start',alignItems:'center',flex:0.1,marginTop:5}}>
                        <Text style={{fontFamily:'bold',fontSize:25,color:'grey'}}>Pilih voting yang ingin diikuti</Text>
                    </View>
                    <View style = {{flex:0.9,justifyContent:'flex-start',alignItems:'stretch'}}>
                    <FlatList
                            data = {this.state.contractDataArr}
                            keyExtractor = { item => item}
                            renderItem = {({item})=>(
                                <View style={{flex:0.1,justifyContent:'center',alignItems:'stretch',marginLeft:5,marginBottom:10,height:80}}>
                                    <this.VotingItem {...item}/>
                                </View>
                             )}
                        />
                    </View>
				<Modal
					animationType="slide"
					transparent={false}
					visible={this.state.modalVisible}
					onRequestClose={() => { this.toggleModal(false) }}>
					<View style={styles.headerContainer}>
						<View style={{flex:0.5, justifyContent:'center', alignItems:'flex-start'}}>
							<TouchableOpacity
								onPress={() => { this.toggleModal(false) }}>
								<Icon name="chevron-left" size={40} color="black" style={{margin: 5}}/>
							</TouchableOpacity>
						</View>
						<View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
							<Text style={styles.headerText}>{this.state.voteId} </Text>
						</View>
						<View style={{flex:0.5, justifyContent:'center', alignItems:'flex-end'}}>
						</View>
					</View>

					<View style={styles.container}>
						<View style={{alignItems:'center'}}>
							<Text style={styles.headerText}>Tentukan pilihanmu: </Text>
						</View>
						{
							this.state.voteData.candidates.map((data, index) => {
								return (
									<View style={{borderRadius:20,marginHorizontal:15,flex:0.1,borderWidth:1,justifyContent:'center',marginTop:15}}>
										<TouchableOpacity
											key={index}
											style={{flex:1,justifyContent:'center',alignItems:'center'}}
											//style={styles.voteButton}
											onPress={() => { this.setState({myChoice: this.state.voteData.candidates[index]}) }}>
											<Text style={{fontSize:25,fontWeight:'bold'}}>{this.state.voteData.candidates[index]}</Text>
										</TouchableOpacity>
									</View>
								)
							})
						}
						<View style={{alignItems:'center',marginTop:20}}>
							<Text style={styles.headerText}>Pilihan kamu: {this.state.myChoice}</Text>
						</View>
					
						<View style={{borderRadius:10,marginHorizontal:20,flex:0.1,justifyContent:'center',backgroundColor:'#04B795',marginTop:50}}>
							<TouchableOpacity
								style={{alignItems:'center',flex:1,justifyContent:'center'}}
								//style={styles.submitButton}
								onPress={() => { this.showConfirmButton() }}>
								<Text style={{fontSize:25,fontWeight:'bold',color:'white'}}>Submit Voting</Text>
							</TouchableOpacity>
						</View>
					</View>
				</Modal>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		backgroundColor: '#F0EFF5'

	},
	containerHalf: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerContainer: {
		flexDirection: 'row',
	},
	headerText: {
		fontSize: 25,
		fontWeight: 'bold'
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
	voteButton: {
		height: 40,
		width: '100%',
		margin: 10,
		backgroundColor: '#17b9c1',
		alignItems: 'center',
		justifyContent: 'center'
	}
});
