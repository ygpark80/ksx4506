import Vorpal from "vorpal"
import net from "net"
import { KSX4506, CommandType, DeviceID, 온도조절기, 전등, 원격검침기, DataFrame } from "./ksx4506"
import JSON5 from "json5"

export function commands(vorpal: Vorpal) {
	new Commands(vorpal)
}

class Commands {

	parser = new KSX4506()

	socket?: net.Socket

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

		this.parser.on("data", (data) => {
			const dataframe = KSX4506.parse(data)

			// if (dataframe.deviceId != 0x40 && dataframe.deviceId != 0x60) {
			// 	console.log(dataframe.toString())
			// }

			// if (dataframe.deviceId != 0x40 && dataframe.deviceId != 0x60
			// 	&& dataframe.deviceId != DeviceID.전등 && dataframe.deviceId != DeviceID.원격검침기 && dataframe.deviceId != DeviceID.대기전력차단기기
			// 	// && dataframe.deviceId != DeviceID.일괄차단기
			// 	&& dataframe.deviceId != DeviceID.가스밸브 && dataframe.deviceId != DeviceID.온도조절기) {
			// 	this.vorpal.log("dataframe=", dataframe.toString())
			// }

			// if (dataframe.deviceId == DeviceID.전등 && dataframe.commandType != CommandType.상태요구 && dataframe.commandType != CommandType.상태응답) {
			//     this.vorpal.log("dataframe=", dataframe.toString())
			// }
			// if (DeviceID[dataframe.deviceId] != undefined && dataframe.deviceId != DeviceID.온도조절기) {
			//     this.vorpal.log("dataframe=", dataframe.toString())
			// }
			// if (dataframe.deviceId == DeviceID.대기전력차단기기 && dataframe.commandType == CommandType.상태응답) {
			// 	this.vorpal.log("dataframe=", dataframe.toString())
			// }

			// if (dataframe.deviceId == DeviceID.원격검침기) {
			// 	this.vorpal.log("dataframe=", dataframe.toString())
			// }
			// if (dataframe.deviceId == DeviceID.원격검침기 && dataframe.commandType == CommandType.상태응답) {
			// 	this.vorpal.log("dataframe=", dataframe.toString())
			// }
			// if (dataframe.deviceId == DeviceID.원격검침기 && dataframe.commandType == CommandType.상태응답 && dataframe.subId != 0x03) {
			// 	this.vorpal.log("dataframe=", dataframe.toString())
			// }
			// if (dataframe.deviceId == DeviceID.원격검침기 && dataframe.commandType != CommandType.상태요구 && dataframe.commandType != CommandType.상태응답) {
			// 	this.vorpal.log("dataframe=", dataframe.toString())
			// }

			// if (dataframe.deviceId == DeviceID.일괄차단기) {
			// 	this.vorpal.log("dataframe=", dataframe.toString())
			// }
			// if (dataframe.deviceId == DeviceID.일괄차단기 && dataframe.commandType != CommandType.상태요구 && dataframe.commandType != CommandType.상태응답) {
			// 	this.vorpal.log("dataframe=", dataframe.toString())
			// }

			// if (dataframe.deviceId == 0x40 && dataframe.commandType != CommandType.상태요구 && dataframe.commandType != CommandType.상태응답) {
			// 	this.vorpal.log("dataframe=", dataframe.toString())
			// }

			if (dataframe.deviceId != 0x40 && dataframe.commandType != CommandType.상태요구 && dataframe.commandType != CommandType.상태응답) {
				this.vorpal.log("dataframe=", dataframe.toString())
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

}
