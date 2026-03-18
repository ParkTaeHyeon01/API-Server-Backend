import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { formatedMovie, formatedMovieDetail } from './app/format_movie.js';
import { formatedWeather } from './app/format_weather.js';
import { formatedExchange } from './app/format_exchange.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Supabase 설정
const SUPABASE_URL = 'https://ivvjyxqmzvoeqozrzyhv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_IiuZAyHX5Ut9ovP5a795wg_nPDVS-SG';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.get('/', (req, res) => {
    res.json({ message: "API Server is Running" });
});

app.get('/movies/search', async (req, res) => {
    try {
        const query = req.query.q;
        const result = await formatedMovie(query);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/movies/popular', async (req, res) => {
    try {
        const result = await formatedMovie();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/movies/:id', async (req, res) => {
    try {
        const movieId = req.params.id; // URL의 :id 값을 가져옴
        const result = await formatedMovieDetail(movieId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "영화를 찾을 수 없거나 서버 오류가 발생했습니다." });
    }
});

app.get('/weather', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        if (!lat || !lon) return res.status(400).json({ error: "좌표가 누락되었습니다." });

        const result = await formatedWeather(lat, lon);
        res.json(result);
    } catch (error) {
        console.error(`[Weather API Error] ${error.message}`);
        
        // 프론트엔드에 500 에러와 구체적인 이유 전달
        res.status(500).json({ 
            error: "기상청 날씨 조회 실패", 
            detail: error.message 
        });
    }
});

app.get('/exchange', async (req, res) => {
    try {
        const result = await formatedExchange();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/join', async (req, res) => {
    try {
        const { username, password, nickname } = req.body; // join.js에서 보낸 데이터

        // Supabase DB에 데이터 삽입
        // 이미지의 컬럼명(user_id, user_pw, name)에 맞춰 매핑합니다.
        const { data, error } = await supabase
            .from('user')
            .insert([
                { 
                    user_id: username, 
                    user_pw: password, 
                    name: nickname 
                }
            ])
            .select();

        if (error) throw error;

        res.status(201).json({ message: "회원가입 성공", user: data });
    } catch (error) {
        console.error("회원가입 에러:", error.message);
        res.status(500).json({ error: "회원가입 중 오류가 발생했습니다." });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Supabase에서 해당 아이디와 비밀번호가 일치하는 유저 조회
        // 이미지의 컬럼명(user_id, user_pw)을 사용합니다.
        const { data, error } = await supabase
            .from('user')
            .select('*')
            .eq('user_id', username)
            .eq('user_pw', password)
            .single(); // 결과가 하나여야 함

        if (error || !data) {
            return res.status(401).json({ error: "아이디 또는 비밀번호가 일치하지 않습니다." });
        }

        // 로그인 성공 시 유저 정보 반환
        res.status(200).json({ 
            message: "로그인 성공", 
            user: { 
                id: data.user_id, 
                name: data.name, 
                uid: data.uid
            } 
        });

    } catch (error) {
        console.error("로그인 서버 에러:", error);
        res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
    }
});


// 2. 리뷰 등록 API
app.post('/reviews', async (req, res) => {
    try {
        const { review_text, uid, movie_id } = req.body;
        
        const { data, error } = await supabase
            .from('review')
            .insert([{ 
                review_text, 
                uid: parseInt(uid), 
                movie_id: String(movie_id), 
                review_time: new Date().toISOString()
            }]);

        // [핵심 수정] error가 있을 때만 message를 읽도록 변경
        if (error) {
            console.error("수파베이스 에러 발생:", error);
            // error 객체가 null이 아님을 보장한 뒤 message에 접근
            return res.status(400).json({ error: error.message || "리뷰 등록 실패" });
        }

        // 성공 시 (error가 null인 경우)
        return res.status(201).json({ message: "리뷰 등록 완료" });

    } catch (e) {
        // 서버 런타임 에러(TypeError 등)가 발생하면 이쪽으로 옵니다.
        console.error("서버 내부 오류:", e);
        // 여기서도 e.message가 null일 수 있으므로 안전하게 처리
        return res.status(500).json({ error: e?.message || "Internal Server Error" });
    }
});

// 1. 특정 영화의 리뷰 목록 조회 (uid 추가)
app.get('/reviews/:movie_id', async (req, res) => {
    const { data, error } = await supabase
        .from('review')
        .select(`
            review_id, 
            review_text, 
            review_time,
            uid, 
            user ( name )
        `)
        .eq('movie_id', req.params.movie_id)
        .order('review_time', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 3. 리뷰 수정 API
app.put('/reviews/:review_id', async (req, res) => {
    const { review_id } = req.params;
    const { review_text, uid } = req.body;
    const { data, error } = await supabase
        .from('review')
        .update({ review_text, review_time: new Date().toISOString() })
        .eq('review_id', review_id)
        .eq('uid', parseInt(uid))
        .select();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "수정 성공", data });
});

// 4. 리뷰 삭제 API
app.delete('/reviews/:review_id', async (req, res) => {
    const { review_id } = req.params;
    const { uid } = req.body;
    const { error } = await supabase
        .from('review')
        .delete()
        .eq('review_id', review_id)
        .eq('uid', parseInt(uid));
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "삭제 성공" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});