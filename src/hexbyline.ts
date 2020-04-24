import { Readable } from "stream"
import lineByLine from "n-readlines"

export class HexByLineReadable extends Readable {

	liner: lineByLine

	constructor(private path: string) {
		super()

		this.liner = new lineByLine(this.path)
	}

	_read(size: number): void {
		const line = this.liner.next()
		if (line) this.push(Buffer.from(line.toString(), "hex"))
        else this.push(null)
	}
}
