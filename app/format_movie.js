import { searchMovieFromTmdb, movieListPopular, movieDetailFromTmdb } from './tmdb_client.js';

const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

export async function formatedMovie(query = null) {
    let data;
    if (query) {
        data = await searchMovieFromTmdb(query);
    } else {
        data = await movieListPopular();
    }

    const results = [];
    const movies = data.results || [];

    for (const movie of movies) {
        const posterPath = movie.poster_path;
        results.push({
            "id": movie.id,
            "제목": movie.title,
            "개봉일": movie.release_date,
            "tmdb평점": movie.vote_average,
            "포스터url": posterPath ? `${POSTER_BASE_URL}${posterPath}` : null
        });
    }

    return results;
}

export async function formatedMovieDetail(movieId) {
    const data = await movieDetailFromTmdb(movieId);

    // 프론트엔드에서 요구하는 키 값에 맞춰서 객체를 반환합니다.
    return {
        id: data.id,
        title: data.title,
        release_date: data.release_date,
        vote_average: data.vote_average,
        // 장르는 배열 형태로 오기 때문에, 이름만 추출해서 쉼표로 연결합니다.
        genres: data.genres ? data.genres.map(g => g.name).join(', ') : "장르 정보 없음",
        runtime: data.runtime,
        overview: data.overview,
        poster_url: data.poster_path ? `${POSTER_BASE_URL}${data.poster_path}` : null
    };
}