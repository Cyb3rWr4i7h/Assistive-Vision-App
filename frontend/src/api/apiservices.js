import axios from 'axios';

const API = axios.create({ baseURL: 'http://local_host:4000' });

export const getExampleData = () => API.get('/example-endpoint');
