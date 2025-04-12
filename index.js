require('dotenv').config()
const ZKLib = require('node-zklib')
const axios = require('axios')

// ✅ Sửa cách khởi tạo ZKLib
const zk = new ZKLib(
    process.env.ZK_IP,
    Number(process.env.ZK_PORT),
    5200,
    5000
)
const { LocalStorage } = require('node-localstorage');
const localStorage = new LocalStorage('./scratch');
var i = 0

async function getTodayLogs() {

    try {
        await zk.createSocket()
        var arr = [];

        while (true) {

            console.log('[✓] Kết nối thành công với máy chấm công lần thứ: ' + i++)
            const defaultTime = '2025-04-09T14:48:17.000Z'
            const rawSavedTime = localStorage.getItem('time') == null ? defaultTime : localStorage.getItem('time')
            const compareTime = new Date(rawSavedTime)
            const logData = await zk.getAttendances()

            for (let log of logData.data) {
                const rawTime = log.recordTime

                const logTime = new Date(rawTime)
                if (isNaN(logTime.getTime())) continue

                if (logTime > compareTime) {
                    arr.push({
                        id: log.userSn,
                        user_id: log.deviceUserId,
                        time: log.recordTime
                    })
                }
            }
            console.log(arr);

            if (arr.length > 0) {
                localStorage.setItem('time', arr[arr.length - 1].time);
                await axios.post(process.env.LARAVEL_API, {
                    attendances: arr
                })
                console.log("Đã cập nhật điểm danh!!");
            }
            await sleep(2000)
        }

        zk.disconnect()
    } catch (err) {
        console.error('[x] Lỗi:', err.message || err)
    }

    setTimeout(() => {
        getTodayLogs()
    }, 2000)
}




getTodayLogs();


