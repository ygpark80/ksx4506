import { Transform, TransformCallback } from "stream"
import chalk from "chalk"
import _debug from "debug"
import JSON5 from "json5"

import { add, xor } from "./utils"

export class KSX4506 extends Transform {

	static HEADER = 0xf7

	stack: number[] = []

	debug = _debug.debug("ksx4506")

	constructor() {
		super({ objectMode: true })
	}

	_transform(chunk: any, encoding: string, callback: TransformCallback): void {
		const buffer = chunk as Buffer
		this.debug(`${chalk.bold.redBright("<<")} ${chalk.white(buffer.toString("hex"))}`)
		buffer.forEach((value) => { this.stack.push(value) })
		this.debug(`${chalk.bold.cyanBright("||")} ${Buffer.from(this.stack).toString("hex")}`)

		do {
			try {
				const dataframe = this.__processStack()
				if (dataframe) {
					this.push(dataframe)
					this.debug(`${chalk.bold.blueBright(">>")} ${dataframe.toString("hex")}${chalk.white(Buffer.from(this.stack).toString("hex"))}`)
				}
				if (!dataframe) break
			} catch (e) {
				// console.log(e, e.stack)
			}
		} while (true)

		callback()
	}

	__processStack() {
		for (let i = 0; i < this.stack.length; i++) {
			if (this.stack[i] !== KSX4506.HEADER) {
				// stack = stack.slice(1)
				// break
				// console.log("--skip")
				continue
			}

			// console.log(`${i}=`, stack[i].toString(16))

			const header = this.stack[i]
			if (i + 4 >= this.stack.length) break

			const deviceId = this.stack[i + 1]
			const subId = this.stack[i + 2]
			const commandType = this.stack[i + 3]
			const length = this.stack[i + 4]
			// console.log("deviceId=", deviceId, subId, commandType, length)

			if (i + 4 + length + 2 >= this.stack.length) break

			const begin = i + 5
			const end = i + 5 + length
			const _data = length > 0 ? Buffer.from(this.stack.slice(begin, end)) : undefined

			// console.log("data=", _data)

			const withoutData = Buffer.from([header, deviceId, subId, commandType, length])
			const beforeXOR = _data ? Buffer.concat([withoutData, _data]) : withoutData
			const _xor = xor(beforeXOR)
			const beforeADD = Buffer.concat([beforeXOR, Buffer.from([_xor])])
			const _add = add(beforeADD)
			const checksum = Buffer.concat([beforeADD, Buffer.from([_add])])

			const data = Buffer.from(this.stack.slice(i, i + 4 + length + 2 + 1))

			this.stack = this.stack.slice(i + 4 + length + 2 + 1)

			if (data.compare(checksum) !== 0) {
				// console.log("data:", data, i, this.stack.length)
				// console.log("chec:", checksum)
				throw new Error(`Cannot parse data: 0x${data.toString("hex")}`)
			}

			return checksum
		}
		return undefined
	}

	static parse(data: Buffer): DataFrame {
		const deviceId = data[1]
		const subId = data[2]
		const commandType = data[3]
		const length = data[4]
		const _data = length > 0 ? data.subarray(5, 5 + length) : undefined

		const result = new DataFrame(deviceId, subId, commandType, _data)

		if (data.compare(result.toBuffer()) !== 0) {
			throw new Error(`Cannot parse data: 0x${data.toString("hex")}`)
		}

		return result
	}

}

export type ONOFF = "ON" | "OFF"

export class DataFrame {

	constructor(public deviceId: DeviceID, public subId: number, public commandType: CommandType, public data?: Buffer) {
	}

	get length() {
		return this.data ? this.data.length : 0
	}

	toBuffer() {
		const withoutData = Buffer.from([KSX4506.HEADER, this.deviceId, this.subId, this.commandType, this.length])
		const beforeXOR = this.data ? Buffer.concat([withoutData, this.data]) : withoutData
		const _xor = xor(beforeXOR)
		const beforeADD = Buffer.concat([beforeXOR, Buffer.from([_xor])])
		const _add = add(beforeADD)
		
		const buffer = Buffer.concat([beforeADD, Buffer.from([_add])])
		return buffer
	}

	public toString = (): string => {
		const result: any = {
			DeviceID: `${DeviceID[this.deviceId]} (0x${Buffer.from([this.deviceId]).toString("hex")})`,
			SubID: `${this.subId} (0x${Buffer.from([this.subId]).toString("hex")})`,
			CommandType: `${CommandType[this.commandType]} (0x${Buffer.from([this.commandType]).toString("hex")})`,
			Length: this.length,
			Data: this.data ? `${this.data?.toString("hex")} (${this.data?.map((v) => v).join(" ")})` : undefined
		}

		return JSON5.stringify(result, null, 2)
	}
}

export enum DeviceID {
	시스템에어컨 = 0x02,
	전자레인지 = 0x04,
	식기세척기 = 0x09,
	드럼세탁기 = 0x0a,
	전등 = 0x0e,
	가스밸브 = 0x12,
	커튼 = 0x13,
	원격검침기 = 0x30,
	도어락 = 0x31,
	실내환기시스템 = 0x32,
	일괄차단기 = 0x33,
	방범확장 = 0x34,
	보일러 = 0x35,
	온도조절기 = 0x36,
	ZigBee모듈 = 0x37,
	스마트전력량계 = 0x38,
	대기전력차단기기 = 0x39
}

// CommandType이 device 당 있어야 함
// 상속 구조도 가능함 (상태요구, 특성요구 같은건 항상 있음)
export enum CommandType {
	상태요구 = 0x01,
	특성요구 = 0x0f,
	상태응답 = 0x81,
	특성응답 = 0x8f,

	// 조명
	개별동작제어요구 = 0x41,
	개별동작제어응답 = 0xc1,

	전체동작제어요구 = 0x42,

	차단설정값설정요구 = 0x43,
	차단설정값요구 = 0x31,
	차단설정값설정응답 = 0xc3,
	차단설정값응답 = 0xb1,

	// 온도조절기
	난방ONOFF동작제어요구 = 0x43,
	설정온도변경동작제어요구 = 0x44,
	외출기능ONOFF동작제어요구 = 0x45,
	예약기능ONOFF동작제어요구 = 0x46,
	온수전용ONOFF동작제어요구 = 0x47,
	난방ONOFF동작제어응답 = 0xc3,
	설정온도변경동작제어응답 = 0xc4,
	예약기능ONOFF동작제어응답 = 0xc5,
	외출기능ONOFF동작제어응답 = 0xc6,
	온수전용ONOFF동작제어응답 = 0xc7,
}
