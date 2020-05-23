import { suite, test } from '@testdeck/jest'
import { KSX4506, CommandType, DeviceID } from '../src/ksx4506'
import { HexByLineReadable } from '../src/hexbyline';

@suite
class TestSuite {

	@test
	async test() {
		const parser = new KSX4506()
		const port = new HexByLineReadable("test/dump")
		port.pipe(parser)

		let count = 0
		for await (const buffer of parser) {
			const dataframe = KSX4506.parse(buffer)
			expect(dataframe.deviceId).toBe(DeviceID.가스밸브)
			expect(dataframe.subId).toBe(1)
			expect(dataframe.commandType).toBe(CommandType.상태응답)
			expect(dataframe.length).toBe(2)
			expect(dataframe.data).toMatchObject(Buffer.from("0001", "hex"))
			count++
		}
		expect(count).toBe(3)
	}
}
