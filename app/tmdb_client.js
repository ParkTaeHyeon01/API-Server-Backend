import axios from 'axios';

const { TMDB_API_KEY } = process.env;

export async function searchMovieFromTmdb(query) {
    const url = "https://api.themoviedb.org/3/search/movie";
    const headers = {
        "accept": "application/json",
        "Authorization": `Bearer ${TMDB_API_KEY}`
    };
    const params = {
        "query": query,
        "include_adult": "false",
        "language": "ko-KR"
    };
    
    const response = await axios.get(url, { headers, params, timeout: 10000 });
    return response.data;
}

export async function movieListPopular() {
    const url = "https://api.themoviedb.org/3/movie/popular";
    const headers = {
        "accept": "application/json",
        "Authorization": `Bearer ${TMDB_API_KEY}`
    };
    const params = {
        "language": "ko-KR"
    };
    
    const response = await axios.get(url, { headers, params, timeout: 10000 });
    return response.data;
}

export async function movieDetailFromTmdb(movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}`;
    const headers = {
        "accept": "application/json",
        "Authorization": `Bearer ${TMDB_API_KEY}`
    };
    const params = {
        "language": "ko-KR"
    };
    
    const response = await axios.get(url, { headers, params, timeout: 10000 });
    return response.data;
}