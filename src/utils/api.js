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

// 全台灣咖啡廳資料

// https://cafenomad.tw/api/v1.0/cafes

// 各城市咖啡廳資料

// https://cafenomad.tw/api/v1.0/cafes/taipei

// https://cafenomad.tw/api/v1.0/cafes/hsinchu

// https://cafenomad.tw/api/v1.0/cafes/taichung

// https://cafenomad.tw/api/v1.0/cafes/kaohsiung

export const getCafes = () => {
	return request('cafes');
}
