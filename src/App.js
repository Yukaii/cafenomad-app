import React, { Component } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';

import { getCafes } from './utils/api';

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
			<ScrollView>
				{ this.state.cafes.map(cafe => {
					return <Text>{JSON.stringify(cafe)}</Text>
				}) }
			</ScrollView>
		)
	}
}
