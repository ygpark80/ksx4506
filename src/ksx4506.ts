import { Transform, TransformCallback } from "stream"
import chalk from "chalk"
import _debug from "debug"

export class KSX4506Parser extends Transform {

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
					// this.push(dataframe)
					this.push(KSX4506Parser.parse(dataframe))
					this.debug(`${chalk.bold.blueBright(">>")} ${dataframe.toString("hex")}${chalk.white(Buffer.from(this.stack).toString("hex"))}`)
				}
				if (!dataframe) break
			} catch (e) {
				console.log(e, e.stack)
			}
		} while (true)

		callback()
	}

	__processStack() {
		for (let i = 0; i < this.stack.length; i++) {
			if (this.stack[i] !== 0xf7) {
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

			const result = { header, deviceId, subId, commandType, length, data: _data, xor: _xor, add: _add }
			const data = Buffer.from(this.stack.slice(i, i + 4 + length + 2 + 1))

			this.stack = this.stack.slice(i + 4 + length + 2 + 1)

			if (data.compare(checksum) !== 0) {
				console.log("data:", data, i, this.stack.length)
				console.log("chec:", checksum)
				throw new Error(`Cannot parse data: 0x${data.toString("hex")}`)
			}

			return checksum
		}
		return undefined
	}

	static parse(data: Buffer): DataFrame {
		const header = data[0]
		const deviceId = data[1]
		const subId = data[2]
		const commandType = data[3]
		const length = data[4]
		const _data = length > 0 ? data.subarray(5, 5 + length) : undefined

		const withoutData = Buffer.from([header, deviceId, subId, commandType, length])
		const beforeXOR = _data ? Buffer.concat([withoutData, _data]) : withoutData
		const _xor = xor(beforeXOR)
		const beforeADD = Buffer.concat([beforeXOR, Buffer.from([_xor])])
		const _add = add(beforeADD)
		const checksum = Buffer.concat([beforeADD, Buffer.from([_add])])

		const result = { header, deviceId, subId, commandType, length, data: _data, xor: _xor, add: _add }

		if (data.compare(checksum) !== 0) {
			// console.log("data:", data)
			// console.log("checksum: ", checksum)
			throw new Error(`Cannot parse data: 0x${data.toString("hex")}`)
		}

		return result
	}

}

export interface DataFrame {
	header: number
	deviceId: number
	subId: number
	commandType: number
	length: number
	data?: Buffer
	xor: number
	add: number
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

export enum CommandType {
	상태요구 = 0x01,
	특성요구 = 0x0f,
	개별동작제어요구 = 0x41,
	개별동작제어응답 = 0xc1,
	전체동작제어요구 = 0x42,
	상태응답 = 0x81,
	특성응답 = 0x8f
}

export function xor(buffer: Buffer) {
	let result = buffer[0]
	for (let i = 1; i < buffer.length; i++) {
		result = result ^ buffer[i]
	}
	return result
}

export function add(buffer: Buffer) {
	let result = buffer[0]
	for (let i = 1; i < buffer.length; i++) {
		result = (result + buffer[i]) % 256
	}
	return result
}
