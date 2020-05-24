import { CommandType, DataFrame, DeviceID, ONOFF } from "../ksx4506"

export class 원격검침기 {

	static 세대검침특성요구() {
		return new DataFrame(DeviceID.원격검침기, 0x0f, CommandType.특성요구)
    }
    
    static parseResponse(dataframe: DataFrame) {
        if (dataframe.deviceId == DeviceID.원격검침기 && dataframe.commandType == CommandType.상태응답 && dataframe.data) {
			const values = [
				(dataframe.data[1] >> 4), (dataframe.data[1] & 0x0f),
				(dataframe.data[2] >> 4), (dataframe.data[2] & 0x0f),
				(dataframe.data[3] >> 4), (dataframe.data[3] & 0x0f),
				(dataframe.data[4] >> 4), (dataframe.data[4] & 0x0f),
				(dataframe.data[5] >> 4), (dataframe.data[5] & 0x0f),
				(dataframe.data[6] >> 4), (dataframe.data[6] & 0x0f),
				(dataframe.data[7] >> 4), (dataframe.data[7] & 0x0f),
			]

			// 사용량은 표준과 다른 것 같음
			// 사용량은 서리자의 경우 누적 총사용량 같음
			let 순시치 = 0, 사용량 = 0
			switch (dataframe.subId) {
				case 0x01: // 수도 검침
				case 0x02: // 가스 검침
				case 0x04: // 온수 검침
					// 정수 3자리 + 소수 3자리
					순시치 = (values[0] * 100) + (values[1] * 10) + (values[2] * 1) + (values[3] * 0.1) + (values[4] * 0.01) + (values[5] * 0.001)
					// 정수 6자리 + 소수 2자리
					사용량 = (values[6] * 100000) + (values[7] * 10000) + (values[8] * 1000) + (values[9] * 100) + (values[10] * 10) + (values[11] * 1) + (values[12] * 0.1) + (values[13] * 0.01)
					break
				case 0x03: // 전기 검침
					// 정수 6자리
					순시치 = (values[0] * 100000) + (values[1] * 10000) + (values[2] * 1000) + (values[3] * 100) + (values[4] * 10) + (values[5] * 1)
					// 정수 7자리 + 소수 1자리
					사용량 = (values[6] * 1000000) + (values[7] * 100000) + (values[8] * 10000) + (values[9] * 1000) + (values[10] * 100) + (values[11] * 10) + (values[12] * 1) + (values[13] * 0.1)
					break
				case 0x05: // 열량 검침
					// 정수 3자리 + 소수 3자리
					순시치 = (values[0] * 100) + (values[1] * 10) + (values[2] * 1) + (values[3] * 0.1) + (values[4] * 0.01) + (values[5] * 0.001)
					// 정수 4자리 + 소수 2자리
					사용량 = (values[6] * 1000) + (values[7] * 100) + (values[8] * 10) + (values[9] * 1) + (values[10] * 0.1) + (values[11] * 0.01)
					break
			}
			return {
                에러상태: dataframe.data[0],
                순시치, 사용량
			}
		}
    }

    static parseFeatureResponse(dataframe: DataFrame) {
        if (dataframe.deviceId == DeviceID.원격검침기 && dataframe.commandType == CommandType.특성응답 && dataframe.data) {
			return {
				열량검침: ((dataframe.data[1] >> 4 & 1) == 1) ? "사용" : "없음",
				온수검침: ((dataframe.data[1] >> 3 & 1) == 1) ? "사용" : "없음",
				전기검침: ((dataframe.data[1] >> 2 & 1) == 1) ? "사용" : "없음",
				가스검침: ((dataframe.data[1] >> 1 & 1) == 1) ? "사용" : "없음",
				수도검침: ((dataframe.data[1] & 1) == 1) ? "사용" : "없음",
			}
		}
    }

}