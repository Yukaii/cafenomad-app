import React, { Component } from 'react';
import {
	StyleSheet,
	Dimensions,
	View,
	ListView,
	Animated,
	PanResponder,
	Linking,
	Alert
} from 'react-native';
import MapView from 'react-native-maps';

import CafeCard from './components/CafeCard';

import { getCafes } from './utils/api';
import { geoLink } from './utils';

const screen = Dimensions.get('window');

const styles = StyleSheet.create({
	map: {
		...StyleSheet.absoluteFillObject
	},
	card: {
		marginTop: screen.height / 5 * 4,
		width: screen.width,
		flex: 1,
		bottom: 0,
		backgroundColor: 'white',
		borderRadius: 10
	}
});

const averagerating = (cafe) => {
	let keys = ['wifi', 'seat', 'quiet', 'tasty', 'cheap', 'music'];
	return Math.round(keys.map(k => cafe[k]).reduce((a, b) => a + b, 0) / keys.length);
};

// Hard code value, calcuate using northern tropic
const LONGITUDE_TO_KM = 102.08;
const LATITUDE_TO_KM  = 110.574;

const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

export default class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			cafes: [],
			cafesNearby: [],
			cafesNearbyDs: ds.cloneWithRows([]),
			drag: new Animated.ValueXY(),
			isCardExpanded: false,
			hasZoomIn: false,
			moveWithZoom: false
		};
	}

	componentDidMount() {
		navigator.geolocation.getCurrentPosition(position => {
			this.map.fitToCoordinates(this.positionRect(position.coords), {
				animated: true
			});

			this.setState({hasZoomIn: true});
		});

		getCafes().then(response => response.json()).then(cafes => {
			this.setState({
				cafes: cafes.map(cafe => {
					return {
						...cafe,
						rating: averagerating(cafe),
						latitude: parseFloat(cafe.latitude),
						longitude: parseFloat(cafe.longitude)
					};
				})
			});
		});
	}

	componentWillMount() {
		this.recentSelectCafeId = null;
		this.recentSelectMarkerCafeId = null;

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
				const { viewportHeightKm } = this.getViewportDimension();

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

						this.setState({isCardExpanded: true, moveWithZoom: true});
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

						this.setState({isCardExpanded: false, moveWithZoom: true});
					}

				}
			}
		});

	}

	componentWillUnmount() {
		this.state.drag.x.removeAllListeners();
		this.state.drag.y.removeAllListeners();
	}

	getViewportDimension() {
		const { width, height } = Dimensions.get('window');

		const viewportWidthKm = this.state.hasZoomIn ? this.viewportWidthKm : 0.7;
		const viewportHeightKm = viewportWidthKm / width * height;

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

	onRegionChangeComplete = (region) => {
		if (this.state.moveWithZoom) {
			this.setState({
				moveWithZoom: false
			});

			return;
		}
		const { longitudeDelta, latitudeDelta, longitude, latitude } = region;

		this.currentRegion = region;
		this.viewportWidthKm = latitudeDelta / 2 * LONGITUDE_TO_KM;

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
		}).sort((c1, c2) => c2.rating - c1.rating);

		this.setState({
			cafesNearbyDs: ds.cloneWithRows(cafesNearby),
			cafesNearby
		});
	}

	onChangeVisibleRows = () => {
		if (this.recentSelectCafeId && this.animatedSecondTimeStart) {
			const index = this.state.cafesNearby.findIndex(c => c.id === this.recentSelectCafeId);
			if (index !== -1) {
				this.scrollToCafeIndex(index);
			}

			this.recentSelectCafeId = null;
		}
	}

	cardStyle = () => {
		return {
			marginTop: Animated.add(this.state.drag.y, new Animated.Value(screen.height / 5 * 4))
		};
	}

	onPressCafeCard = cafe => {
		return () => {
			const { viewportHeightKm, viewportWidthKm } = this.getViewportDimension();

			if (this.state.isCardExpanded) {
				this.animatedSecondTimeStart = false;
				this.map.animateToRegion({
					latitude: cafe.latitude - viewportHeightKm / LATITUDE_TO_KM / 4,
					longitude: cafe.longitude,
					latitudeDelta: viewportHeightKm / LATITUDE_TO_KM,
					longitudeDelta: viewportWidthKm / LONGITUDE_TO_KM
				});

				this.markerRefs[cafe.id].showCallout();

				this.animatedSecondTimeStart = true;
				this.map.animateToRegion({
					latitude: cafe.latitude - viewportHeightKm / LATITUDE_TO_KM / 4,
					longitude: cafe.longitude,
					latitudeDelta: viewportHeightKm / LATITUDE_TO_KM,
					longitudeDelta: viewportWidthKm / LONGITUDE_TO_KM
				});

			} else {
				this.animatedSecondTimeStart = false;
				this.map.animateToCoordinate({
					latitude: cafe.latitude,
					longitude: cafe.longitude
				});

				this.markerRefs[cafe.id].showCallout();

				// workaround for coord not in center
				this.animatedSecondTimeStart = true;
				this.map.animateToCoordinate({
					latitude: cafe.latitude,
					longitude: cafe.longitude
				});
			}

			this.recentSelectCafeId = cafe.id;
		};
	}

	scrollToCafeIndex = (index) => {
		if (index > 0) {
			let sumOfHeight = 0;
			for (let i = 0; i <= index-1; i++) {
				sumOfHeight += this.cardHeights[this.state.cafesNearby[i].id] + 5;
			}

			this.listview.scrollTo({y: sumOfHeight});
		} else { // index == 0
			this.listview.scrollTo({y: 0});
		}
	}

	onCardLayout = (event, id) => {
		const {height} = event.nativeEvent.layout;
		if (typeof this.cardHeights === 'undefined') {
			this.cardHeights = {};
		}

		this.cardHeights[id] = height;
	}

	onCafeMarkerSelect = (event) => {
		const { latitude, longitude } = event.nativeEvent.coordinate;

		const cafeIndex = this.state.cafesNearby.findIndex(cafe => cafe.latitude === latitude && cafe.longitude === longitude);
		const cafe = this.state.cafesNearby[cafeIndex];

		if (cafeIndex !== -1) {
			this.setState({currentSelectCafeId: cafe.id});
			this.scrollToCafeIndex(cafeIndex);
		}
	}

	openExternalMap = (cafe) => {
		return () => {
			Alert.alert(
				'打開導航地圖',
				'', [{
					text: '好',
					onPress: () => Linking.openURL(geoLink({latitude: cafe.latitude, longitude: cafe.longitude, address: cafe.address}))
				}, {
					text: '算了',
					onPress: () => console.log('Cancel Pressed'),
					style: 'cancel'
				}]
			);
		};
	}

	renderNearbyCafeCard = (cafe) => {
		return(
			<CafeCard
				key={cafe.id}
				id={cafe.id}
				onLayout={this.onCardLayout}
				onPress={this.onPressCafeCard(cafe)}
				title={cafe.name}
				description={cafe.address}
				rating={cafe.rating}
				onNavigateButtomPress={this.openExternalMap(cafe)}
			/>
		);
	}

	render() {
		return(
			<View style={{ flex: 1, position: 'relative' }}>
				<MapView
					ref={ref => { this.map = ref; }}
					style={styles.map}
					onRegionChangeComplete={this.onRegionChangeComplete}
					onMarkerSelect={this.onCafeMarkerSelect}
					showsUserLocation={true}
				>
					{this.state.cafes.map(cafe => (
						<MapView.Marker
							coordinate={{latitude: cafe.latitude, longitude: cafe.longitude}}
							title={cafe.name}
							id={cafe.id}
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
						style={{alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderColor: '#bbb'}}
						{...this._panResponder.panHandlers}
					>
						<View style={{width: 35, backgroundColor: '#c6c6c3', height: 5, borderRadius: 5}} />
					</View>
					<ListView
						ref={ref => { this.listview = ref; }}
						style={{flex: 1, paddingHorizontal: 6, paddingVertical: 5}}
						dataSource={this.state.cafesNearbyDs}
						enableEmptySections={true}
						renderRow={this.renderNearbyCafeCard}
						onChangeVisibleRows={this.onChangeVisibleRows}
					>
					</ListView>
				</Animated.View>
			</View>
		);
	}
}
