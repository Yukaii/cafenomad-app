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

export default class CafeCard extends Component {
	static propTypes = {
		onPress: PropTypes.func.isRequired,
		title: PropTypes.string,
		description: PropTypes.string,
		rating: PropTypes.number
	}

	render() {
		const { onPress, title, description, rating } = this.props;

		return (
			<View style={{flex: 1, paddingHorizontal: 7, paddingVertical: 7, marginVertical: 5, overflow: 'hidden', borderRadius: 5, backgroundColor: '#eeeeee', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
				<TouchableOpacity onPress={onPress} style={{maxWidth: screen.width / 5 * 3, flexDirection: 'column'}}>
					<Text style={{fontSize: 16}}>{title}</Text>
					<Text style={{fontSize: 11, color: '#3e3e3e'}}>{description}</Text>
				</TouchableOpacity>
				<Text>{rating} ★</Text>
			</View>
		);
	}
}
