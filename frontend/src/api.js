import axios from 'axios';

export const fetchSensorData = () => axios.get('http://localhost:2000/api/sensor');
export const postSensorData = (data) => axios.post('http://localhost:2000/api/sensor', data);