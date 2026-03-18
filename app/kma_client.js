import axios from 'axios';

const KMA_AUTH_KEY = "0gA_V960RKqAP1fetBSqoA";

export async function getGridCoords(lon, lat) {
    const url = `https://apihub.kma.go.kr/api/typ01/cgi-bin/url/nph-dfs_xy_lonlat?lon=${lon}&lat=${lat}&help=0&authKey=${KMA_AUTH_KEY}`;
    const response = await axios.get(url);
    
    // 텍스트 응답에서 마지막 줄 추출 후 공백으로 분리
    const lines = response.data.trim().split('\n');
    const dataLine = lines[lines.length - 1].trim();
    const parts = dataLine.split(/\s+/); // 공백(스페이스/탭) 기준 분할
    
    // 결과 예시: ["126.987221,", "37.571888,", "60,", "127"]
    // 콤마 제거 후 뒤에서 두 번째가 nx, 마지막이 ny
    const nx = parts[parts.length - 2].replace(',', '');
    const ny = parts[parts.length - 1].replace(',', '');
    
    return { nx, ny };
}

export async function searchWeatherFromKMA(nx, ny) {
    const now = new Date();
    
    // 단기예보(getVilageFcst)는 base_time이 0200, 0500, 0800... 등 3시간 단위입니다.
    // 가장 안전한 호출을 위해 현재 시간 기준 이전 예보 시점을 계산하거나,
    // 제공해주신 예시대로 2300 데이터를 가져오도록 시간을 고정해 테스트해보세요.
    now.setHours(now.getHours() - 2); // 예보 생성 시간을 고려해 넉넉히 과거 시점

    const baseDate = now.getFullYear() + 
                     String(now.getMonth() + 1).padStart(2, '0') + 
                     String(now.getDate()).padStart(2, '0');
    // 단기예보의 가장 최근 baseTime 계산 (예시: 02, 05, 08, 11, 14, 17, 20, 23)
    const hours = now.getHours();
    const baseHours = [2, 5, 8, 11, 14, 17, 20, 23].filter(h => h <= hours).pop() || 23;
    const baseTime = String(baseHours).padStart(2, '0') + '00';

    const url = `https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstInfoService_2.0/getVilageFcst`;
    
    const response = await axios.get(url, {
        params: {
            authKey: KMA_AUTH_KEY,
            pageNo: 1,
            numOfRows: 12, // 1시간치 예보 항목들
            dataType: 'JSON',
            base_date: baseDate,
            base_time: baseTime,
            nx: nx,
            ny: ny
        }
    });

    if (response.data?.response?.header?.resultCode !== "00") {
        throw new Error(response.data?.response?.header?.resultMsg);
    }

    return response.data.response.body.items.item;
}