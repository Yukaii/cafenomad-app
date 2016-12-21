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
			cafes: [],
			cafesNearby: []
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

	onRegionChangeComplete = (region) => {
		const { longitudeDelta, latitudeDelta, longitude, latitude } = region;

		let boundary = [
			{
				latitude: latitude + latitudeDelta,
				longitude: longitude + longitudeDelta
			},
			{
				latitude: latitude - latitudeDelta,
				longitude: longitude - longitudeDelta
			}
		];

		let cafesNearby = this.state.cafes.filter(cafe => {
			return (cafe.longitude < boundary[0].longitude) &&
			       (cafe.longitude > boundary[1].longitude) &&
			       (cafe.latitude  < boundary[0].latitude)  &&
						 (cafe.latitude  > boundary[1].latitude);
		});

		this.setState({
			cafesNearby
		});

		console.log(`cafesNearby: ${cafesNearby.length}`);
	}

	getViewportDimension() {
		const { width, height } = Dimensions.get('window');
		const viewportHeightKm = 0.7 / width * height;
		const viewportWidthKm = 0.7;

		return {
			viewportHeightKm,
			viewportWidthKm
		};
	}

	positionRect(coords) {
		const { latitude, longitude } = coords;
		const { viewportWidthKm, viewportHeightKm } = this.getViewportDimension();

		const LONGITUDE_TO_KM = 102.08;
		const LATITUDE_TO_KM  = 110.574;

		return [
			{
				latitude: latitude + viewportHeightKm / LATITUDE_TO_KM / 2,
				longitude: longitude + viewportWidthKm / LONGITUDE_TO_KM / 2
			},
			{
				latitude: latitude - viewportHeightKm / LATITUDE_TO_KM / 2,
				longitude: longitude - viewportWidthKm / LONGITUDE_TO_KM / 2
			}
		];
	}

	render() {
		return(
			<MapView
				ref={ref => { this.map = ref; }}
				style={styles.map}
				onRegionChangeComplete={this.onRegionChangeComplete}
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
