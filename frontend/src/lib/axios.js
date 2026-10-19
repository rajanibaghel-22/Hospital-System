import axios from "axios";

// Paste your live backend URL here once you deploy backend. 
// KEEP "/api" at the end!
const api = axios.create({
  baseURL: "https://hospital-system-opxr.onrender.com/api", 
});

export default api;
