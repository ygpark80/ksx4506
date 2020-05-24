import { CommandType, DataFrame, DeviceID, ONOFF } from "../ksx4506"

export class 전등 {

	// 표준이랑 다름
	static 개별동작(subId: number, index: number, command: "ON" | "OFF") {
		// data0 = 전등 index
		// data1 = ON = 1, OFF = 0
		// data0 = ??
		const data = command == "ON" ? Buffer.from([index, 1, 0]) : Buffer.from([index, 0, 0])
		return new DataFrame(DeviceID.전등, subId, CommandType.개별동작제어요구, data)
	}

	static parseData(data: Buffer) {
		const states: ONOFF[] = []
		for (let i = 1; i < data.length; i++) {
			states.push(data[i] == 1 ? "ON" : "OFF")
		}
		return states
	}

}

/*

{
  DeviceID: '전등 (0x0e)',
  SubID: '17 (0x11)',
  CommandType: '특성요구 (0x0f)',
  Length: 0,
}
{
  DeviceID: '전등 (0x0e)',
  SubID: '17 (0x11)',
  CommandType: '특성응답 (0x8f)',
  Length: 3,
  Data: '000300 (0 3 0)',
}

{
  DeviceID: '전등 (0x0e)',
  SubID: '18 (0x12)',
  CommandType: '특성요구 (0x0f)',
  Length: 0,
}
{
  DeviceID: '전등 (0x0e)',
  SubID: '18 (0x12)',
  CommandType: '특성응답 (0x8f)',
  Length: 3,
  Data: '000200 (0 2 0)',
}

{
  DeviceID: '전등 (0x0e)',
  SubID: '19 (0x13)',
  CommandType: '특성요구 (0x0f)',
  Length: 0,
}
{
  DeviceID: '전등 (0x0e)',
  SubID: '19 (0x13)',
  CommandType: '특성응답 (0x8f)',
  Length: 3,
  Data: '000100 (0 1 0)',
}

{
  DeviceID: '전등 (0x0e)',
  SubID: '20 (0x14)',
  CommandType: '특성요구 (0x0f)',
  Length: 0,
}
{
  DeviceID: '전등 (0x0e)',
  SubID: '20 (0x14)',
  CommandType: '특성응답 (0x8f)',
  Length: 3,
  Data: '000100 (0 1 0)',
}

*/