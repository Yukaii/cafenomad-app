import React, { Component } from 'react';
import { View, Text, Alert, ScrollView, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';

import { getCafes } from './utils/api';

const styles = StyleSheet.create({
  map: {
		...StyleSheet.absoluteFillObject
  },
});

export default class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			cafes: []
		};
	}

	componentDidMount() {
		getCafes().then(response => response.json()).then(cafes => {
			this.setState({
				cafes
			});
		})
	}

	render() {
		return(
			<MapView
				style={styles.map}
			>
				{this.state.cafes.map(cafe => (
					<MapView.Marker
						coordinate={{latitude: parseFloat(cafe.latitude), longitude: parseFloat(cafe.longitude)}}
						title={cafe.name}
					/>
				))}
			</MapView>
		)
	}
}
