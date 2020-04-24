import { suite, test } from '@testdeck/jest'
import { KSX4506Parser, DataFrame } from '../src/ksx4506'
import { HexByLineReadable } from '../src/hexbyline';

@suite
class TestSuite {

	@test
	async test() {
		const parser = new KSX4506Parser()
		const port = new HexByLineReadable("test/dump")
		port.pipe(parser)

		let count = 0
		for await (const dataframe of parser) {
			expect(dataframe).toStrictEqual({
				header: 247,
				deviceId: 18,
				subId: 1,
				commandType: 129,
				length: 2,
				data: Buffer.from("0001", "hex"),
				xor: 102,
				add: 244
			})
			count++
		}
		expect(count).toBe(3)
	}
}
