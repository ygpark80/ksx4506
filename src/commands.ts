import Vorpal from "vorpal"
import net from "net"
import { KSX4506, CommandType, DeviceID, 온도조절기, 전등, 원격검침기, DataFrame } from "./ksx4506"
import JSON5 from "json5"
import Table from "cli-table3"

export function commands(vorpal: Vorpal) {
	new Commands(vorpal)
}

class Commands {

	parser = new KSX4506()

	socket?: net.Socket

	_states = {
		filter: {
			deviceIds: [] as number[]
		},
		knownDeviceIds: [] as number[]
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
			.command("states")
			.action((args) => this.states(args))

		this.parser.on("data", (data) => {
			const dataframe = KSX4506.parse(data)

			if (this._states.knownDeviceIds.indexOf(dataframe.deviceId) < 0) {
				this._states.knownDeviceIds.push(dataframe.deviceId)
				this._states.knownDeviceIds.sort()
			}

			if (this._states.filter.deviceIds.indexOf(dataframe.deviceId) >= 0) {
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

	async states(args: Vorpal.Args) {
		const table = new Table({
			head: ["Name", "DeviceID"]
		})

		for (const deviceId of this._states.knownDeviceIds) {
			table.push([ `${DeviceID[deviceId]}`, `0x${Buffer.from([ deviceId ]).toString("hex")} (${deviceId})` ])
		}

		this.vorpal.log(table.toString())
	}

}
