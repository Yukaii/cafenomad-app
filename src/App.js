import React, { Component } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import MapView from 'react-native-maps';

import { getCafes } from './utils/api';

const styles = StyleSheet.create({
	map: {
		...StyleSheet.absoluteFillObject
	}
});

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

		const { width, height } = Dimensions.get('window');
		const viewportHeightKm = 0.7 / width * height;
		const viewportWidthKm = 0.7;

		const LONGITUDE_TO_KM = 102.08;
		const LATITUDE_TO_KM  = 110.574;

		return [
			{
				latitude: latitude + viewportHeightKm / LATITUDE_TO_KM / 2,
				longitude: longitude - viewportWidthKm / LONGITUDE_TO_KM / 2
			},
			{
				latitude: latitude - viewportHeightKm / LATITUDE_TO_KM / 2,
				longitude: longitude + viewportWidthKm / LONGITUDE_TO_KM / 2
			}
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
						key={cafe.id}
					/>
				))}
			</MapView>
		);
	}
}
