import { deflateSync, deflateRawSync } from 'node:zlib';

const buf = Buffer.from("hello".repeat(845_000));

console.time('node zlib');
for (let i = 0; i < 500; i++) {
	const compressed2 = deflateSync(buf, { level: 9, windowBits: 15, memLevel: 9 });
}
console.timeEnd('node zlib');


console.time('bun zlib');
for (let i = 0; i < 500; i++) {
	const crc = Buffer.allocUnsafe(4);
	crc.writeUInt32BE(Bun.hash.adler32(buf));
	const compressed1 = Buffer.concat([
		Buffer.from([0x78, 0xda]),
		Buffer.from(Bun.deflateSync(buf, { level: 9, windowBits: 15, memLevel: 9 })),
		crc,
	]);
}
console.timeEnd('bun zlib');

//const compressed3 = deflateRawSync(buf, options);

//console.log(compressed1);
//console.log(compressed2);
//console.log(compressed3);

//console.log(Buffer.compare(compressed1, compressed2));

//zlib headers
//78 DA - Best Compression
//78 9C - Default Compression
//78 5E - Fast Compression
//78 01 - No Compression/low