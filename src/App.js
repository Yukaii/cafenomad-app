import React, { Component } from 'react';
import { View, Text, Alert, ScrollView, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';

import { getCafes } from './utils/api';

const styles = StyleSheet.create({
	map: {
		...StyleSheet.absoluteFillObject
	}
});

const SPACE = 0.003;

export default class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			cafes: []
		};
	}

	componentDidMount() {
		navigator.geolocation.getCurrentPosition(position => {
			this.map.fitToCoordinates(this.positionRect(position.coords), {
				animated: true
			});
		});

		getCafes().then(response => response.json()).then(cafes => {
			this.setState({
				cafes
			});
		});
	}

	positionRect(coords) {
		const { latitude, longitude } = coords;

		return [
			{ latitude: latitude - SPACE, longitude: longitude - SPACE },
			{ latitude: latitude + SPACE, longitude: longitude + SPACE },
		];
	}

	render() {
		return(
			<MapView
				ref={ref => { this.map = ref; }}
				style={styles.map}
			>
				{this.state.cafes.map(cafe => (
					<MapView.Marker
						coordinate={{latitude: parseFloat(cafe.latitude), longitude: parseFloat(cafe.longitude)}}
						title={cafe.name}
					/>
				))}
			</MapView>
		);
	}
}
