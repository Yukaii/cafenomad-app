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
		onLayout: PropTypes.func,
		title: PropTypes.string,
		description: PropTypes.string,
		id: PropTypes.string,
		rating: PropTypes.number
	}

	onLayout = (id) => {
		return (...props) => {
			this.props.onLayout(...props, id);
		};
	}

	render() {
		const { onPress, title, description, rating } = this.props;

		return (
			<View
				style={{flex: 1, paddingHorizontal: 8, paddingVertical: 8, marginVertical: 3, overflow: 'hidden', borderRadius: 5, backgroundColor: '#eeeeee', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}
				onLayout={this.onLayout(this.props.id)}
			>
				<TouchableOpacity onPress={onPress} style={{maxWidth: screen.width / 5 * 3, flexDirection: 'column'}}>
					<Text style={{fontSize: 16}}>{title}</Text>
					<Text style={{fontSize: 11, color: '#3e3e3e'}}>{description}</Text>
				</TouchableOpacity>
				<Text>{rating} ★</Text>
			</View>
		);
	}
}
