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

function hasArrayChanged(newArr, oldArr) {
    return JSON.stringify(newArr) !== JSON.stringify(oldArr);
}

var i = 0

async function getTodayLogs() {

    try {
        await zk.createSocket()
        const arr = [];

        console.log('[✓] Kết nối thành công với máy chấm công.' + i++)
        const defaultTime = '2025-04-09T14:48:17.000Z'
        const rawSavedTime = localStorage.getItem('time') == null ? defaultTime : localStorage.getItem('time')
        const compareTime = new Date(rawSavedTime)
        const logData = await zk.getAttendances()
        for (let log of logData.data) {
            const rawTime = log.recordTime || log.timestamp
            if (!rawTime) continue

            const logTime = new Date(rawTime)
            if (isNaN(logTime.getTime())) continue

            if (logTime > compareTime) {
                arr.push({
                    user_id: log.deviceUserId,
                    time: log.recordTime
                })
            }
        }

        if (arr.length > 0) {
            localStorage.setItem('time', arr[arr.length - 1].time)
        }

        let oldArray = JSON.parse(localStorage.getItem('myArray')) || [];

        if (arr.length > 0) {
            if (hasArrayChanged(arr, oldArray)) {
                await axios.post(process.env.LARAVEL_API, {
                    attendances: arr
                })
                localStorage.setItem('myArray', JSON.stringify(arr));
                console.log("Đã call api");
            }
        }

        zk.disconnect()
    } catch (err) {
        console.error('[x] Lỗi:', err.message || err)
    }

    setTimeout(() => {
        getTodayLogs()
    }, 5000)
}

getTodayLogs();


