import { CommandType, DataFrame, DeviceID, ONOFF } from "../ksx4506"

export class 온도조절기 {

	static 난방(subId: number, command: "ON" | "OFF") {
		const data = command == "ON" ? Buffer.from([1]) : Buffer.from([0])
		return new DataFrame(DeviceID.온도조절기, subId, CommandType.난방ONOFF동작제어요구, data)
	}

	static 외출기능(subId: number, command: "ON" | "OFF") {
		const data = command == "ON" ? Buffer.from([1]) : Buffer.from([0])
		return new DataFrame(DeviceID.온도조절기, subId, CommandType.외출기능ONOFF동작제어요구, data)
	}

	static 특성요구(subId: number) {
		return new DataFrame(DeviceID.온도조절기, subId, CommandType.특성요구)
    }
    
    static parseResponse(dataframe: DataFrame) {
        const response = ([
			CommandType.상태응답, CommandType.난방ONOFF동작제어응답, CommandType.설정온도변경동작제어응답, CommandType.예약기능ONOFF동작제어응답,
			CommandType.외출기능ONOFF동작제어응답, CommandType.온수전용ONOFF동작제어응답
		].indexOf(dataframe.commandType) >= 0)
		if (dataframe.deviceId == DeviceID.온도조절기 && response && dataframe.data) {
			const result: any = {
				에러상태코드: Buffer.from([dataframe.data[0]]).toString("hex"),
				난방상태: Buffer.from([dataframe.data[1]]).toString("hex"),
				외출기능상태: Buffer.from([dataframe.data[2]]).toString("hex"),
				예약기능상태: Buffer.from([dataframe.data[3]]).toString("hex"),
				온수전용상태: dataframe.data[4] == 0x01 ? "ON" : "OFF"
			}
			result.난방 = []
			for (let i = 0; i < ((dataframe.data.length - 5) / 2); i++) {
				result.온도조절기.난방[i] = {
					난방상태: ((dataframe.data[1] >> i) & 1) == 1 ? "ON" : "OFF",
					외출기능상태: ((dataframe.data[2] >> i) & 1) == 1 ? "ON" : "OFF",
					예약기능상태: ((dataframe.data[3] >> i) & 1) == 1 ? "ON" : "OFF",
					설정온도: `${dataframe.data[5 + (i * 2)]} (0x${Buffer.from([dataframe.data[5 + (i * 2)]]).toString("hex")}), 0.5°C 여부: ${((dataframe.data[5 + (i * 2)] >> 7) & 1) ? "유" : "무"}`,
					현재온도: `${dataframe.data[5 + (i * 2) + 1]} (0x${Buffer.from([dataframe.data[5 + (i * 2) + 1]]).toString("hex")}), 0.5°C 여부: ${((dataframe.data[5 + (i * 2) + 1] >> 7) & 1) ? "유" : "무"}`,
				}
			}
		}
    }

    static parseActionResonse(dataframe: DataFrame) {
        const request = ([
			CommandType.난방ONOFF동작제어요구, CommandType.예약기능ONOFF동작제어요구, CommandType.외출기능ONOFF동작제어요구, CommandType.온수전용ONOFF동작제어요구
		].indexOf(dataframe.commandType) > 0)
		if (dataframe.deviceId == DeviceID.온도조절기 && request && dataframe.data) {
			return {
				동작제어요구: dataframe.data[0] == 0x01 ? "ON" : "OFF"
			}
		}
    }

    static parseTemperatureChangeResponse(dataframe: DataFrame) {
        if (dataframe.deviceId == DeviceID.온도조절기 && dataframe.commandType == CommandType.설정온도변경동작제어요구 && dataframe.data) {
			return {
				동작제어요구: `${dataframe.data[0]} (0x${Buffer.from([dataframe.data[0]]).toString("hex")}), 0.5°C 여부: ${((dataframe.data[0] >> 7) & 1) ? "유" : "무"}`
			}
		}
    }

}

