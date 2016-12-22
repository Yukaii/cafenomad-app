import React, { Component } from 'react';
import { StyleSheet, Dimensions, View, Text, ListView, TouchableOpacity } from 'react-native';
import MapView from 'react-native-maps';

import { getCafes } from './utils/api';

const screen = Dimensions.get('window');

const styles = StyleSheet.create({
	map: {
		...StyleSheet.absoluteFillObject
	},
	card: {
		marginTop: screen.height / 4 * 3,
		paddingTop: 15,
		width: screen.width - 30,
		marginLeft: 15,
		flex: 1,
		bottom: 0,
		backgroundColor: 'white'
	}
});

const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

export default class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			cafes: [],
			cafesNearby: ds.cloneWithRows([]),
			markerRefs: {}
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
			cafesNearby: ds.cloneWithRows(cafesNearby)
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

		// Hard code value, calcuate using northern tropic
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

	onPressCafe = cafe => {
		return () => {
			this.map.animateToCoordinate({
				latitude: cafe.latitude,
				longitude: cafe.longitude
			});

			this.markerRefs[cafe.id].showCallout();

			// workaround for coord not in center
			this.map.animateToCoordinate({
				latitude: cafe.latitude,
				longitude: cafe.longitude
			});
		};
	}

	render() {
		return(
			<View style={{ flex: 1, position: 'relative' }}>
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
							ref={
								ref => {
									if (typeof this.markerRefs === 'undefined') {
										this.markerRefs = {};
									}
									this.markerRefs[cafe.id] = ref;
								}
							}
						/>
					))}
				</MapView>
				<ListView
					style={styles.card}
					dataSource={this.state.cafesNearby}
					enableEmptySections={true}
					renderRow={cafe => {
						return(
							<TouchableOpacity onPress={this.onPressCafe(cafe)}>
								<Text key={cafe.id}>{cafe.name}</Text>
							</TouchableOpacity>
						);
					}}
				>
				</ListView>
			</View>
		);
	}
}
