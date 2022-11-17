import { CommandType, DataFrame, DeviceID, ONOFF } from "../ksx4506"

export class Breaker {

    static parseResponse(dataframe: DataFrame) {
        if (dataframe.deviceId == DeviceID.일괄차단기 && dataframe.commandType == CommandType.상태응답 && dataframe.data) {
            const data = dataframe.data
            return {
                엘리베이터하강호출요구: ((data[1] >> 5) & 1) == 1 ? "요구" : "요구 없음",
                엘리베이터상승호출요구: ((data[1] >> 4) & 1) == 1 ? "요구" : "요구 없음",
                대기전력차단릴레이ONOFF상태: ((data[1] >> 3) & 1) == 1 ? "ON" : "OFF",
                일괄전등차단릴레이ONOFF상태: ((data[1] >> 2) & 1) == 1 ? "ON" : "OFF",
                외출설정요구: ((data[1] >> 1) & 1) == 1 ? "요구" : "요구 없음",
                가스잠금요구: (data[1] & 1) == 1 ? "요구" : "요구 없음",
            }	
		}
    }

    static parseFeatureResponse(dataframe: DataFrame) {
        if (dataframe.deviceId == DeviceID.일괄차단기 && dataframe.commandType == CommandType.특성응답 && dataframe.data) {
            const data = dataframe.data
            return {
                엘리베이터층표시기능: ((data[1] >> 4) & 1) == 1 ? "있음" : "없음",
                엘리베이터호출기능: ((data[1] >> 3) & 1) == 1 ? "있음" : "없음",
                대기전력제어기능: ((data[1] >> 2) & 1) == 1 ? "있음" : "없음",
                외출설정기능: ((data[1] >> 1) & 1) == 1 ? "있음" : "없음",
                가스잠금기능: (data[1] & 1) == 1 ? "있음" : "없음",
            }
		}
        
    }

}
