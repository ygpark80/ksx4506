import Vorpal from "vorpal"
import net from "net"
import { KSX4506, CommandType, DeviceID, DataFrame, ONOFF } from "./ksx4506"
import JSON5 from "json5"
import Table from "cli-table3"
import { 전등, 온도조절기, 원격검침기 } from "./devices"

export function commands(vorpal: Vorpal) {
	new Commands(vorpal)
}

interface Device {
	deviceId: number
	subIds: number[]
}

class Commands {

	parser = new KSX4506()

	socket?: net.Socket

	_states = {
		filter: {
			deviceIds: [] as number[]
		},
		devices: {} as { [key: string]: Device },
		lights: {} as { [key: string]: ONOFF[] }
	}

	constructor(private vorpal: Vorpal) {
		vorpal
			.command("connect")
			.action((args) => this.connect(args))

		vorpal
			.command("disconnect")
			.action((args) => this.disconnect(args))

		vorpal
			.command("light <subId> <index> <command>")
			.action((args) => this.light(args))
		
		vorpal
			.command("light feature <subId>")
			.action((args) => this.lightFeature(args))

		vorpal
			.command("measure <subId>")
			.action((args) => this.measure(args))

		vorpal
			.command("breaker")
			.action((args) => this.breaker(args))

		vorpal
			.command("command <deviceId> <subId> <commandType>")
			.action((args) => this.command(args))

		vorpal
			.command("show <deviceId> [commandType]")
			.action((args) => this.show(args))

		vorpal
			.command("hide <deviceId> [commandType]")
			.action((args) => this.hide(args))

		vorpal
			.command("now")
			.action((args) => this.now(args))

		this.parser.on("data", (data) => {
			const dataframe = KSX4506.parse(data)

			// lights
			if (dataframe.deviceId == DeviceID.전등 && dataframe.commandType == CommandType.상태응답 && dataframe.data) {
				const states = 전등.parseData(dataframe.data)
				this._states.lights[dataframe.subId.toString()] = states
			}

			// devices
			let device = this._states.devices[dataframe.deviceId.toString()]
			if (!device) this._states.devices[dataframe.deviceId.toString()] = device = { deviceId: dataframe.deviceId, subIds: [] }
			if (device.subIds.indexOf(dataframe.subId) < 0) device.subIds.push(dataframe.subId)
			device.subIds.sort()

			// show
			if (this._states.filter.deviceIds.indexOf(dataframe.deviceId) >= 0) {
				this.vorpal.log(`${dataframe.toString()}`)
			}

			if (dataframe.deviceId == DeviceID.전등 && dataframe.commandType == CommandType.특성응답) {
				this.vorpal.log(`${dataframe.toString()}`)
			}
		})
	}

	async connect(args: Vorpal.Args) {
		this.socket = net.connect({ host: "192.168.31.21", port: 8899 })
		this.socket.pipe(this.parser)
	}

	async disconnect(args: Vorpal.Args) {
		this.socket?.destroy()
		this.socket = undefined
	}

	async light(args: Vorpal.Args) {
		const { subId, index, command } = args

		this.vorpal.log(`${JSON5.stringify(args)}`)
		this.socket?.write(전등.개별동작(subId, index, command == "on" ? "ON" : "OFF").toBuffer())
		this.vorpal.log(`${전등.개별동작(subId, index, command == "on" ? "ON" : "OFF").toString()}`)
	}

	async lightFeature(args: Vorpal.Args) {
		const { subId } = args

		const message = new DataFrame(DeviceID.전등, subId, CommandType.특성요구)
		this.socket?.write(message.toBuffer())
		this.vorpal.log(`${message.toString()}`)
	}

	async measure(args: Vorpal.Args) {
		const { subId } = args

		const dataframe = new DataFrame(DeviceID.원격검침기, subId, CommandType.상태요구)
		this.socket?.write(dataframe.toBuffer())
		this.vorpal.log(`${dataframe.toString()}`)
	}

	async breaker(args: Vorpal.Args) {
		const dataframe = new DataFrame(DeviceID.일괄차단기, 0x01, CommandType.특성요구)
		this.socket?.write(dataframe.toBuffer())
		this.vorpal.log(`${dataframe.toString()}`)
	}

	async command(args: Vorpal.Args) {
		const { deviceId, subId, commandType } = args

		const dataframe = new DataFrame(deviceId, subId, commandType)
		this.socket?.write(dataframe.toBuffer())
		this.vorpal.log(`${dataframe.toString()}`)
	}

	async show(args: Vorpal.Args) {
		const { deviceId } = args

		if (this._states.filter.deviceIds.indexOf(deviceId) < 0) this._states.filter.deviceIds.push(deviceId)
	}

	async hide(args: Vorpal.Args) {
		const { deviceId } = args

		const index = this._states.filter.deviceIds.indexOf(deviceId)
		if (index >= 0) this._states.filter.deviceIds.splice(index, 1)
	}

	async now(args: Vorpal.Args) {
		{
			const table = new Table({ head: ["Name", "DeviceID", "SubIDs"] })
			for (const deviceId of Object.keys(this._states.devices)) {
				const device = this._states.devices[deviceId]
				table.push([
					`${DeviceID[device.deviceId]}`,
					toHexString(device.deviceId),
					device.subIds.map((subId) => toHexString(subId)).join(", ")
				])
			}

			this.vorpal.log("Devices:")
			this.vorpal.log(table.toString())
		}
		{
			const table = new Table({ head: ["DeviceID", "SubID", "전등1", "전등2", "전등3"] })
			for (const subId of Object.keys(this._states.lights)) {
				table.push([toHexString(DeviceID.전등), toHexString(Number(subId)), ...this._states.lights[subId]])
			}

			this.vorpal.log("Lights:")
			this.vorpal.log(table.toString())
		}
	}

}

function toHexString(value: number) {
	return `0x${Buffer.from([value]).toString("hex")} (${value})`
}
