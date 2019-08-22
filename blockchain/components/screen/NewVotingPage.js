import React from 'react';
import { StyleSheet, Text, View, AsyncStorage, TextInput, TouchableOpacity, Alert, Picker } from 'react-native';

export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			voteId: "",
			candidate1: "",
			candidate2: "",
			limit: "",
			candidates: 2,
			candidateArray: ["", ""]
		}
	}

	showErrorMessage(title, message) {
		Alert.alert(title, message)
	}

	checkArrayNull() {
		var count = 0
		for (var x = 0; x < this.state.candidateArray.length; x++) {
			if (this.state.candidateArray[x] != "")
				count ++
		}
		if (count == this.state.candidateArray.length) {
			return true
		} else {
			return false
		}
	}

	submitButtonTapped() {
		if (this.voteId != "" && this.state.limit != "" && this.checkArrayNull()) {
			if(this.state.limit > 0 || this.state.limit )
			AsyncStorage.getItem(global.blockchain, (err, res) => {
				if (!err && res) {
					const contractData = JSON.parse(res).contracts.chain
					var ending = false
					for (var x = 0; x < contractData.length; x++) {
						if (contractData[x].data.voteId === this.state.voteId) {
							ending = true
							break
						}
					}
					if (ending) {
						this.showErrorMessage('Nama Campaign Telah Terdaftar', 'Mohon Masukan Nama Campaign Yang Lain')
					} else {
						const candidateArray = this.state.candidateArray
						const voteData = {
							voteId: this.state.voteId,
							limit: this.state.limit,
							candidates: candidateArray,
						}
						AsyncStorage.getItem(global.loggedIn, (err, res) => {
							if (!err && res) {
								this.showErrorMessage('Berhasil Membuat Voting Baru')
								const data = JSON.parse(res)
								global.addNewContract(voteData, data.privateKey)
							} else {
								this.showErrorMessage('Tidak Tersambung Pada Sistem', 'Mohon Periksa Koneksi Jaringan')
							}
						})
					}

				} else {
					this.showErrorMessage('Vote ID Is Not Available', 'Please Enter Valid Vote ID')
				}
			})
		} else {
			this.showErrorMessage('Data Tidak Lengkap', 'Mohon Isi Seluruh Data')
		}
	}

	render() {
		return (
			<View style={styles.container}>
				<View style={{height:40,borderWidth:1,borderRadius:20,marginHorizontal:50}}>
					<TextInput
						style={{paddingLeft:20}}
						placeholder = "Nama Campaign"	
						value={this.state.voteId}
						autoCorrect={false}
						underlineColorAndroid='transparent'
						onChangeText={(text) => {
							this.setState({voteId: text})
						}}
					/>
				</View>
				<View style={{height:40,borderWidth:1,borderRadius:20,marginHorizontal:50,marginTop:20}}>
					<TextInput
						style={{paddingLeft:20}}
						placeholder = "Jumlah Partisipan"	
						value={this.state.limit}
						autoCorrect={false}
						underlineColorAndroid='transparent'
						keyboardType="phone-pad"
						onChangeText={(text) => {
							this.setState({limit: text})
						}}
					/>
				</View>
				<View style={{justifyContent:'center',alignItems:'center',marginTop:20,flexDirection:'row',borderWidth:1,borderRadius:20,marginHorizontal:50,backgroundColor:"#F1F2F2"}}>
					<Picker
						mode = "dropdown"
						selectedValue={this.state.candidates}
						style={styles.half}
						onValueChange={(itemValue, itemIndex) => {
							var tempArray = this.state.candidateArray
							if (tempArray.length < itemValue) {
								for (var x = 0; x < itemValue - tempArray.length; x++)
									tempArray.push("")
							} else if (tempArray.length > itemValue) {
								for (var x = 0; x < tempArray.length - itemValue; x++)
									tempArray.pop()
							}
							this.setState({candidates: itemValue})
						}}>
						<Picker.Item label="Jumlah opsi : 2" value="2" />
						<Picker.Item label="Jumlah opsi : 3" value="3" />
					</Picker>
				</View>
				{
					this.state.candidateArray.map((data, index) => {
						var placeholder = "Opsi " + (index + 1)
						return (
							<View style={{borderWidth:1,borderRadius:20,marginHorizontal:50,marginTop:10,height:40}}>
								<TextInput
									key={index}
									style={styles.textInput}
									value={this.state.candidateArray[index]}
									autoCorrect={false}
									underlineColorAndroid='transparent'
									placeholder={placeholder}
									onChangeText={(text) => {
										var tempArray = this.state.candidateArray
										tempArray[index] = text
										this.setState({candidateArray: tempArray})
									}}/>
								</View>
						)
					})

				}
				<View style={{height:70,marginTop:20,borderRadius:20,marginHorizontal:50,justifyContent:'flex-end',backgroundColor:'#333333'}}>
					<TouchableOpacity
						style={{flex:1,justifyContent:'center',alignItems:'center'}}
						onPress={() => {
							this.submitButtonTapped()
						}}>
						<Text style={{fontWeight:'bold',fontSize:20,color:'white'}}>Create Vote</Text>
					</TouchableOpacity>
				</View>
				
			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'stretch',
		marginTop:25

	},
	containerHalf: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	textInput: {
		paddingLeft:20,
	},
	half: {
		width: '89%',
		justifyContent:'center',
		alignItems:'center'
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
	}
});
