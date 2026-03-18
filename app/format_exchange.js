import { getExchangeByDate } from './oapikorea_client.js';

function formatDateObjToString(dateObj) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}

async function getValidData(startDateObj) {
    // 데이터가 있는 가장 가까운 날짜의 데이터를 찾아주는 함수
    for (let i = 0; i < 10; i++) { // 최대 10일 전까지 뒤져봄
        const targetDateObj = new Date(startDateObj);
        targetDateObj.setDate(targetDateObj.getDate() - i);
        
        const targetDateStr = formatDateObjToString(targetDateObj);
        const data = await getExchangeByDate(targetDateStr);
        
        if (data) {
            return { data, dateObj: targetDateObj };
        }
    }
    return { data: null, dateObj: null };
}

export async function formatedExchange() {
    const now = new Date();
    
    // 1. '오늘' 기준 가장 최근 영업일 데이터 찾기
    const { data: todayUsd, dateObj: todayObj } = await getValidData(now);
    
    if (!todayUsd || !todayObj) {
        throw new Error("최근 환율 데이터를 찾을 수 없습니다.");
    }

    // 2. '찾은 날'보다 하루 전부터 시작해서 '그 전 영업일' 데이터 찾기
    const yesterdayStartObj = new Date(todayObj);
    yesterdayStartObj.setDate(yesterdayStartObj.getDate() - 1);
    const { data: yesterdayUsd } = await getValidData(yesterdayStartObj);

    if (!yesterdayUsd) {
        throw new Error("어제 환율 데이터를 찾을 수 없습니다.");
    }

    // 3. 계산 (상승/하락 판단)
    const tPrice = parseFloat(todayUsd.deal_bas_r.replace(/,/g, ''));
    const yPrice = parseFloat(yesterdayUsd.deal_bas_r.replace(/,/g, ''));
    const diff = tPrice - yPrice;
    
    let status = diff > 0 ? "상승 ▲" : "하락 ▼";
    if (diff === 0) status = "보합 -";

    // 날짜 포맷팅 (MM.DD.)
    const formattedDate = `${String(todayObj.getMonth() + 1).padStart(2, '0')}.${String(todayObj.getDate()).padStart(2, '0')}.`;

    // 숫자를 콤마 포함 소수점 2자리 문자열로
    const formatNumber = (num) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatPercent = (num) => {
        const sign = num > 0 ? '+' : '';
        return `${sign}${num.toFixed(2)}%`;
    };

    return {
        "조회기준": formattedDate,
        "현재가": `${formatNumber(tPrice)}원`,
        "변동액": `${formatNumber(Math.abs(diff))}원`,
        "변동률": formatPercent((diff / yPrice) * 100),
        "상태": status,
        "출처": "한국수출입은행"
    };
}