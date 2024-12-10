class BuPNG {
	static #VERSION = "BuPNG v0.2";
	
	static #PNG_SIGN = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	static #PNG_IHDR = Buffer.from([0, 0, 0, 0x0d,		//length
							0x49, 0x48, 0x44, 0x52,		//IHDR
							0, 0, 0, 0,					//width
							0, 0, 0, 0,					//height
							8, 6, 0, 0, 0,				//0-255, RGBa, etc.
							0, 0, 0, 0]);				//crc
	static #PNG_IDAT = Buffer.from([0, 0, 0, 0,			//length
							0x49, 0x44, 0x41, 0x54]);	//IDAT
	static #PNG_IEND = Buffer.from([0, 0, 0, 0,			//length
							0x49, 0x45, 0x4e, 0x44,		//IEND
							0xae, 0x42, 0x60, 0x82]);	//crc
	static #PIXEL_SIZE = 4 //*RGBa*;
	static #FILTER_SIZE = 1; //one byte before each scanline
	
	#width;
	#height;
	#canvas;		//Buffer
	#png_buf;		//Buffer
	#mustRebuild; //boolean, must rebuild png_buf or not?

	#buildPNG() {
		const output = new Bun.ArrayBufferSink();

		output.write(BuPNG.#PNG_SIGN.buffer);

		const hdr = Buffer.from(BuPNG.#PNG_IHDR); //Buffer.from(<Buffer>|<Uint8Array>) new Buffer instance!
		hdr.writeUInt32BE(this.#width, 8);
		hdr.writeUInt32BE(this.#height, 12);
		hdr.writeUInt32BE(Bun.hash.crc32(hdr.subarray(4, -4)), 21);
		output.write(hdr.buffer);

		const data = Buffer.concat([
			BuPNG.#PNG_IDAT,
			//windowBits: -15 set by default in node:zlib!
			//header and footer will not be added to deflate body without it!!!
			Bun.deflateSync(this.#canvas, { level: 9, windowBits: -15 }),
			Buffer.allocUnsafe(4)
		]);
		data.writeUInt32BE(data.length - 12, 0);
		data.writeUInt32BE(Bun.hash.crc32(data.subarray(4, -4)), data.length - 4);
		output.write(data.buffer);

		output.write(BuPNG.#PNG_IEND.buffer);

		this.#png_buf = Buffer.from(output.end());
		this.#mustRebuild = false;
		return true;
	}
	
	plotPixel(x, y, r = 0, g = 0, b = 0, a = 255) {
		let offset = (this.#width * BuPNG.#PIXEL_SIZE + BuPNG.#FILTER_SIZE) * y +
						x * BuPNG.#PIXEL_SIZE + BuPNG.#FILTER_SIZE;
		this.#canvas[offset] = r;
		this.#canvas[offset + 1] = g;
		this.#canvas[offset + 2] = b;
		this.#canvas[offset + 3] = a;		//0-transparent 255-opaque
		this.#mustRebuild = true;	//canvas was modified, must rebuild
		return true;
	}

	plotLine(x0, y0, x1, y1, r = 0, g = 0, b = 0, a = 255) {
		//A Rasterizing Algorithm for Drawing Curves
		//Alois Zingl
	
		let dx = Math.abs(x1 - x0);
		let dy = -Math.abs(y1 - y0);
		let sx = (x0 < x1) ? 1 : -1;
		let sy = (y0 < y1) ? 1 : -1;
		let err = dx + dy, e2;
	
		for (;;) {
			this.plotPixel(x0, y0, r, g, b, a);
		
			e2 = 2 * err;
			if (e2 >= dy) {
				if (x0 == x1) break;
				err += dy;
				x0 += sx;
			}
			if (e2 <= dx) {
				if (y0 == y1) break;
				err += dx;
				y0 += sy;
			}
		}
	
		return true;
	}

	getBase64() {
		if (this.#mustRebuild) {
			this.#buildPNG();
		}
		return 'data:image/png;base64,' + this.#png_buf.toString('base64');
	}

	async saveFile(fname = 'image.png') {
		if (this.#mustRebuild) {
			this.#buildPNG();
		}
		await Bun.write(fname, this.#png_buf);
		return true;
	}
	
	get version() {
		return BuPNG.#VERSION;
	}
	
	constructor(w, h) {
		this.#width = w;
		this.#height = h;
		this.#canvas = Buffer.allocUnsafe(
			(this.#width * BuPNG.#PIXEL_SIZE + BuPNG.#FILTER_SIZE) * this.#height);

		//init canvas
		for (let i = 0; i < this.#height; i++) {
			this.#canvas[(this.#width * BuPNG.#PIXEL_SIZE + BuPNG.#FILTER_SIZE) * i] = 0; //filter
		}
		for (let i = 0; i < this.#height; i++) {
			for (let j = 0; j < this.#width; j++) {
				this.plotPixel(j, i, 255, 255, 255, 255); //white opaque
			}
		}
		this.#mustRebuild = true; //png_buf is still empty
	}

}

if (import.meta.main) {
	console.log('Use as module only!');
	process.exit();
}

export { BuPNG };


