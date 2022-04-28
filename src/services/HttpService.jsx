import axios from 'axios';

const instance = axios.create({});

instance.interceptors.request.use(async function (config) {
  config.headers['Accept'] = "application/json";
  config.headers['Content-Type'] = "application/json";
  return config;
});

export default instance;