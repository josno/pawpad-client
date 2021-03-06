import config from "../config";

const TokenService = {
	saveAuthToken(token) {
		window.localStorage.setItem(config.TOKEN_KEY, token);
	},
	getAuthToken() {
		//get it everytime you make a fetch request to the API
		return window.localStorage.getItem(config.TOKEN_KEY);
	},
	clearAuthToken() {
		window.localStorage.removeItem(config.TOKEN_KEY);
	},
	hasAuthToken() {
		//boolean
		return !!TokenService.getAuthToken();
	},
	saveShelterToken(token) {
		window.localStorage.setItem("shelter", token);
	},
	getShelterToken() {
		return window.localStorage.getItem("shelter");
	},
	clearShelterToken() {
		window.localStorage.removeItem("shelter");
	},
};

export default TokenService;
