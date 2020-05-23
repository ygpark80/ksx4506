import Vorpal from "vorpal"
import net from "net"
import { KSX4506, CommandType, DeviceID, 온도조절기, 전등 } from "./ksx4506"
import JSON5 from "json5"

export function commands(vorpal: Vorpal) {
	new Commands(vorpal)
}

const 우리집 = {
	온도조절기: {
		거실: 17,
		침실1: 18
	},
	전등: { 거실: 17 }
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

		this.parser.on("data", (data) => {
			const dataframe = KSX4506.parse(data)

			// if (dataframe.deviceId != 64 && dataframe.deviceId != 96 && dataframe.deviceId != DeviceID.전등
			//     && dataframe.deviceId != DeviceID.원격검침기 && dataframe.deviceId != DeviceID.대기전력차단기기
			//     && dataframe.deviceId != DeviceID.일괄차단기 && dataframe.deviceId != DeviceID.온도조절기
			//     && dataframe.deviceId != DeviceID.가스밸브) {
			// if (dataframe.deviceId == DeviceID.전등 && dataframe.commandType != CommandType.상태요구 && dataframe.commandType != CommandType.상태응답) {
			//     this.vorpal.log("dataframe=", dataframe.toString())
			// }
			// if (DeviceID[dataframe.deviceId] != undefined && dataframe.deviceId != DeviceID.온도조절기) {
			//     this.vorpal.log("dataframe=", dataframe.toString())
			// }
			if (dataframe.deviceId == DeviceID.대기전력차단기기 && dataframe.commandType == CommandType.상태응답) {
				this.vorpal.log("dataframe=", dataframe.toString())
			}
			// if (dataframe.deviceId == DeviceID.대기전력차단기기) {
			// 	this.vorpal.log("dataframe=", dataframe.toString())
			// }
		})

	}

	async connect(args: Vorpal.Args) {
		this.socket = net.connect({ host: "192.168.31.21", port: 8899 })
		this.socket.pipe(this.parser)

		// setInterval(() => {
		// 	this.socket?.write(온도조절기.난방(우리집.온도조절기.침실1, "OFF").toBuffer())
		// 	this.vorpal.log("wrote")
		// }, 3000)
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

}
