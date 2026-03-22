import axios from 'axios';

const { SLACK_WEBHOOK_URL } = process.env;

export const sendJoinNotification = async (nickname) => {
    try {
        await axios.post(SLACK_WEBHOOK_URL, {
            text: `'${nickname}' 님이 가입하셨습니다. (${new Date().toLocaleString()})`
        });
    } catch (error) {
        console.error('슬랙 알림 전송 실패:', error.message);
    }
};