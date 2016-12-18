const API_BASE_URL = 'https://cafenomad.tw/api/v1.0'

const request = (path, method='GET', params=null) => {

	let requestOption = {
		method: method,
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
		}
	}

	if (method === 'GET' && params) {
		requestOption.body = JSON.stringify(params);
	}

	return fetch(`${API_BASE_URL}/${path}`, requestOption);
}

export const getCafes = () => {
	return request('cafes');
}

export const getTaipeiCafes = () => {
	return request('cafes/taipei');
}

export const getHsinchuCafes = () => {
	return request('cafes/hsinchu');
}

export const getTaichungCafes = () => {
	return request('cafes/taichung');
}

export const getKaohsiungCafes = () => {
	return request('cafes/kaohsiung');
}
