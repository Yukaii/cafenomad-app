import { Platform } from 'react-native';

export function geoLink({latitude, longitude, address}) {
	// TODO: this should be configured
	if (Platform.OS === 'ios') {
		return `https://maps.apple.com/?ll=${latitude},${longitude}&address=${address}`;
	} else if (Platform.OS === 'android') {
		return `https://maps.google.com/maps?q=${latitude},${longitude}&address=${address}`;
	} else {
		return '';
	}
}
