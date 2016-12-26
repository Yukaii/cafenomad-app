import React, { Component } from 'react';
import {
	StyleSheet,
	Dimensions,
	View,
	Text,
	ListView,
	TouchableOpacity,
	Animated,
	PanResponder
} from 'react-native';
import MapView from 'react-native-maps';

import { getCafes } from './utils/api';

const screen = Dimensions.get('window');

const styles = StyleSheet.create({
	map: {
		...StyleSheet.absoluteFillObject
	},
	card: {
		marginTop: screen.height / 5 * 4,
		width: screen.width - 30,
		marginLeft: 15,
		flex: 1,
		bottom: 0,
		backgroundColor: 'white'
	}
});

// Hard code value, calcuate using northern tropic
const LONGITUDE_TO_KM = 102.08;
const LATITUDE_TO_KM  = 110.574;

const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

export default class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			cafes: [],
			cafesNearby: ds.cloneWithRows([]),
			markerRefs: {},
			drag: new Animated.ValueXY(),
			isCardExpanded: false
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

	componentWillMount() {
		const { viewportHeightKm } = this.getViewportDimension();

		this._animatedValueX = 0;
		this._animatedValueY = 0;

		this.state.drag.x.addListener((value) => this._animatedValueX = value.value);
		this.state.drag.y.addListener((value) => this._animatedValueY = value.value);

		this._panResponder = PanResponder.create({
			onMoveShouldSetResponderCapture: () => true,
			onMoveShouldSetPanResponderCapture: () => true,
			onPanResponderGrant: (e, gestureState) => {
				this.state.drag.setOffset({x: this._animatedValueX, y: this._animatedValueY});
				this.state.drag.setValue({x: 0, y: 0}); //Initial value
			},
			onPanResponderMove: (e, gestureState) => {
				if (gestureState.moveY > screen.height / 5) {
					Animated.event([
						null, {dx: this.state.drag.x, dy: this.state.drag.y}
					])(e, gestureState);
				}
			},
			onPanResponderRelease: (e, gestureState) => {
				this.state.drag.flattenOffset(); // Flatten the offset so it resets the default positioning

				if (gestureState.moveY < (4 / 5 + 1 / 2) / 2 * screen.height) {
					Animated.spring(this.state.drag, {
						toValue: {x: 0, y: -(4 / 5 - 1 / 2) * screen.height}
					}).start();

					if (!this.state.isCardExpanded) {
						this.map.animateToRegion({
							...this.currentRegion,
							latitude: this.currentRegion.latitude - viewportHeightKm / LATITUDE_TO_KM / 4
						});

						this.setState({isCardExpanded: true});
					}

				} else {
					Animated.spring(this.state.drag, {
						toValue: {x: 0, y: 0}
					}).start();

					if (this.state.isCardExpanded) {
						this.map.animateToRegion({
							...this.currentRegion,
							latitude: this.currentRegion.latitude + viewportHeightKm / LATITUDE_TO_KM / 4
						});

						this.setState({isCardExpanded: false});
					}

				}
			}
		});

	}

	componentWillUnmount() {
		this.state.drag.x.removeAllListeners();
		this.state.drag.y.removeAllListeners();
	}

	onRegionChangeComplete = (region) => {
		const { longitudeDelta, latitudeDelta, longitude, latitude } = region;
		this.currentRegion = region;

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

	cardStyle = () => {
		return {
			marginTop: Animated.add(this.state.drag.y, new Animated.Value(screen.height / 5 * 4)),
			width: this.state.drag.y.interpolate({
				inputRange: [-screen.height / 2, -screen.height / 3, 0, 10],
				outputRange: [screen.width, screen.width, screen.width - 30, screen.width - 30]
			}),
			marginLeft: this.state.drag.y.interpolate({
				inputRange: [-screen.height / 2, -screen.height / 3, 0, 10],
				outputRange: [0, 0, 15, 15]
			}),
		};
	}

	onPressCafe = cafe => {
		const { viewportHeightKm, viewportWidthKm } = this.getViewportDimension();

		return () => {
			if (this.state.isCardExpanded) {
				this.map.animateToRegion({
					latitude: cafe.latitude - viewportHeightKm / LATITUDE_TO_KM / 4,
					longitude: cafe.longitude,
					latitudeDelta: viewportHeightKm / LATITUDE_TO_KM,
					longitudeDelta: viewportWidthKm / LONGITUDE_TO_KM
				});

				this.markerRefs[cafe.id].showCallout();

				this.map.animateToRegion({
					latitude: cafe.latitude - viewportHeightKm / LATITUDE_TO_KM / 4,
					longitude: cafe.longitude,
					latitudeDelta: viewportHeightKm / LATITUDE_TO_KM,
					longitudeDelta: viewportWidthKm / LONGITUDE_TO_KM
				});
			} else {
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
			}

		};
	}

	render() {
		return(
			<View style={{ flex: 1, position: 'relative' }}>
				<MapView
					ref={ref => { this.map = ref; }}
					style={styles.map}
					onRegionChangeComplete={this.onRegionChangeComplete}
					showsUserLocation={true}
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
				<Animated.View style={[styles.card, this.cardStyle()]}>
					<View
						style={{alignItems: 'center', paddingVertical: 10}}
						{...this._panResponder.panHandlers}
					>
						<View style={{width: 35, backgroundColor: '#3e3e3e', height: 5, borderRadius: 5}} />
					</View>
					<ListView
						style={{flex: 1}}
						dataSource={this.state.cafesNearby}
						enableEmptySections={true}
						renderRow={cafe => {
							return(
								<TouchableOpacity onPress={this.onPressCafe(cafe)} style={{flex: 1}}>
									<Text key={cafe.id}>{cafe.name}</Text>
								</TouchableOpacity>
							);
						}}
					>
					</ListView>
				</Animated.View>
			</View>
		);
	}
}
