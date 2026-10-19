import axios from "axios";

// Paste your live backend URL here once you deploy backend. 
// KEEP "/api" at the end!
const api = axios.create({
  baseURL: "https://YOUR-BACKEND-NAME.onrender.com/api", 
});

export default api;