import React, {
	Component,
	PropTypes
} from 'react';

import {
	View,
	Text,
	TouchableOpacity,
	Dimensions
} from 'react-native';

const screen = Dimensions.get('window');
import Icon from 'react-native-vector-icons/Ionicons';

export default class CafeCard extends Component {
	static propTypes = {
		onPress: PropTypes.func.isRequired,
		onLayout: PropTypes.func,
		title: PropTypes.string,
		description: PropTypes.string,
		id: PropTypes.string,
		rating: PropTypes.number,
		onNavigateButtomPress: PropTypes.func
	}

	onLayout = (id) => {
		return (...props) => {
			this.props.onLayout(...props, id);
		};
	}

	render() {
		const { onPress, title, description, rating, onNavigateButtomPress } = this.props;

		return (
			<View
				style={{flex: 1, paddingHorizontal: 8, paddingVertical: 8, marginVertical: 3, overflow: 'hidden', borderRadius: 5, backgroundColor: '#eeeeee', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}
				onLayout={this.onLayout(this.props.id)}
			>
				<TouchableOpacity onPress={onPress} style={{maxWidth: screen.width / 5 * 3, flexDirection: 'column'}}>
					<Text style={{fontSize: 16, color: 'black'}}>{title}</Text>
					<Text style={{fontSize: 11, color: '#3e3e3e'}}>{description}</Text>
				</TouchableOpacity>
				<View style={{flexDirection: 'row', alignItems: 'center'}}>
					<TouchableOpacity onPress={onNavigateButtomPress} style={{padding: 7}}>
						<Icon name="md-map" size={19} style={{marginRight: 7, color: '#333'}} />
					</TouchableOpacity>
					<Text style={{color: '#333'}}>{rating} <Text>★</Text></Text>
				</View>
			</View>
		);
	}
}
