import axios from 'axios';

export async function getExchangeByDate(targetDate) {
    const authKey = "GDuUSw33baa0MSLn6VxpJHwYnyfPXLBB";
    const url = `https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON?authkey=${authKey}&searchdate=${targetDate}&data=AP01`;
    
    try {
        const response = await axios.get(url);
        const data = response.data;
        
        // 달러(USD) 데이터만 찾아서 돌려줍니다.
        if (Array.isArray(data)) {
            return data.find(item => item.cur_unit === 'USD') || null;
        }
        return null;
    } catch (error) {
        console.error("Exchange API Error:", error.message);
        return null;
    }
}