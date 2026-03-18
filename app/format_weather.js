import { getGridCoords, searchWeatherFromKMA } from './kma_client.js';

export async function formatedWeather(lat, lon) {
    const { nx, ny } = await getGridCoords(lon, lat);
    const items = await searchWeatherFromKMA(nx, ny);

    // 단기예보(getVilageFcst) 카테고리에 맞게 수정
    const getValue = (cat) => items.find(i => i.category === cat)?.fcstValue || '0';

    const skyCode = getValue('SKY'); // 하늘상태: 1(맑음), 3(구름많음), 4(흐림)
    const ptyCode = getValue('PTY'); // 강수형태
    const temp = getValue('TMP');   // 기온
    const reh = getValue('REH');   // 습도
    const wsd = getValue('WSD');   // 풍속

    let status = '맑음';
    let icon = '01d';

    // 1. 강수 확인
    if (ptyCode !== '0') {
        const ptyMap = { '1': '비', '2': '비/눈', '3': '눈', '4': '소나기' };
        status = ptyMap[ptyCode] || '강수';
        icon = (ptyCode === '3') ? '13d' : '09d';
    } 
    // 2. 구름 확인 (강수 없을 때)
    else {
        if (skyCode === '3') {
            status = '구름많음';
            icon = '03d';
        } else if (skyCode === '4') {
            status = '흐림';
            icon = '04d';
        }
    }

    return {
        "상태": status,
        "아이콘": `https://openweathermap.org/img/wn/${icon}@2x.png`,
        "기온": `${temp}°C`,
        "강수량": getValue('PCP'), // "강수없음" 또는 "1mm"
        "습도": `${reh}%`,
        "풍속": `${wsd} m/s`
    };
}