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
