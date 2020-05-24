import { CommandType, DataFrame, DeviceID, ONOFF } from "../ksx4506"

export class Power {

    static parseResponse(dataframe: DataFrame) {
        if (dataframe.deviceId == DeviceID.대기전력차단기기 && dataframe.commandType == CommandType.상태응답 && dataframe.data) {
            const result = {
                에러상태: dataframe.data[0],
                채널: [] as any[]
            }
            const n = ((this.length - 1) / 3)
            for (let i = 0; i < n; i++) {
                const data1 = dataframe.data[1 + (i * 3)]
                const data2 = dataframe.data[1 + (i * 3) + 1]
                const data3 = dataframe.data[1 + (i * 3) + 2]

                const _1000 = data1 & 0x0f
                const _100 = data2 >> 4
                const _10 = data2 & 0x0f
                const _1 = data3 >> 4
                const _0 = data3 & 0x0f

                result.채널[i] = {
                    자동차단설정: ((data1 >> 7) & 1) == 1 ? "자동 차단 설정 상태" : "수동차단 설정 상태",
                    자동차단기준값이내: ((data1 >> 6) & 1) == 1 ? "자동 차단 기준값 이내" : "해당사항 없음",
                    과부하상태: ((data1 >> 5) & 1) == 1 ? "과부하상태" : "해당사항 없음",
                    상태: ((data1 >> 4) & 1) == 1 ? "채널켜짐(전원공급 상태)" : "채널꺼짐(전원차단 상태)",
                    소비전력: (1000 * _1000) + (100 * _100) + (10 * _10) + (1 * _1) + (0.1 * _0)
                }
            }
        }
    }

}