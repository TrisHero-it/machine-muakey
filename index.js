require('dotenv').config()
const ZKLib = require('node-zklib')
const axios = require('axios')

// ✅ Sửa cách khởi tạo ZKLib
const zk = new ZKLib(
    process.env.ZK_IP,
    Number(process.env.ZK_PORT),
    20000,
    5000
)
const { LocalStorage } = require('node-localstorage');
const localStorage = new LocalStorage('./scratch');
var i = 0

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function getTodayLogs() {
    try {
        await zk.createSocket()
        const arr = []

        console.log(`[✓] Kết nối thành công với máy chấm công lần thứ: ${i++}`)
        const defaultTime = '2025-04-14T00:00:00.000Z'
        const rawSavedTime = localStorage.getItem('time') || defaultTime
        const compareTime = new Date(rawSavedTime)

        const logData = await zk.getAttendances()
        await zk.freeData() // 👈 quan trọng: giải phóng buffer sau khi đọc

        for (let log of logData.data) {
            const logTime = new Date(log.recordTime)
            if (isNaN(logTime.getTime())) continue

            if (logTime > compareTime) {
                arr.push({
                    id: log.userSn,
                    user_id: log.deviceUserId,
                    time: log.recordTime
                })
            }
        }

        console.log(logData.data.reverse())

        if (arr.length > 0) {
            localStorage.setItem('time', arr[arr.length - 1].time)
            await axios.post(process.env.LARAVEL_API, { attendances: arr })
            console.log("✅ Đã cập nhật điểm danh!!")
        }

        zk.disconnect()

    } catch (err) {
        console.error('[x] Lỗi:', err)
    }

    // 👉 Lặp lại sau 5 giây
    await sleep(5000)
    getTodayLogs()
}


getTodayLogs();


