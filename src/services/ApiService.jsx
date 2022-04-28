import http from './HttpService'

const { REACT_APP_API_BASE_URL } = process.env;

const baseUrl = REACT_APP_API_BASE_URL;

export const getTourDetails360 = (payload) => http.post(`${baseUrl}/get/360tourdetails`, payload);

export const getGCSSignedURL = (payload) => http.post(`${baseUrl}/getBulkSignedURLsFor360Tour`, payload);
