import packageJson from 'bupng/package.json' with { type: 'json' };
import { deflateSync } from 'node:zlib';

class BuPNG {
	static #VERSION = `${packageJson.name} v${packageJson.version}`;
	
	static #PNG_SIGN = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); //PNG
	static #PNG_IHDR = Buffer.from([0, 0, 0, 0x0d,				//length of fields (*)
									0x49, 0x48, 0x44, 0x52,		//IHDR
									0, 0, 0, 0,					//width (*) offset 8d
									0, 0, 0, 0,					//height (*) offset 12d
									8, 6, 0, 0, 0,				//0-255, RGBa, etc. (*)
									0, 0, 0, 0]);				//crc offset 21d
	static #PNG_IDAT = Buffer.from([0, 0, 0, 0,					//length of field (*) offset 0d
									0x49, 0x44, 0x41, 0x54]);	//IDAT
									//deflate .... (*)
									//crc offset -4d
	static #PNG_IEND = Buffer.from([0, 0, 0, 0,					//length
									0x49, 0x45, 0x4e, 0x44,		//IEND
									0xae, 0x42, 0x60, 0x82]);	//crc
	
	static #PIXEL_SIZE = 4;		//*RGBa*
	static #FILTER_SIZE = 1;	//one byte before each scanline

	#width: number;
	#height: number;
	#canvas: Buffer;
	#png_buf: Buffer;
	#mustRebuild: boolean;

	constructor(w = 10, h = 10) {
		this.#width = w;
		this.#height = h;
		this.#canvas = Buffer.allocUnsafe((this.#width * BuPNG.#PIXEL_SIZE + BuPNG.#FILTER_SIZE) * this.#height);

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

	#buildPNG(): boolean {
		//header
		const header = Buffer.from(BuPNG.#PNG_IHDR);
		header.writeUInt32BE(this.#width, 8);
		header.writeUInt32BE(this.#height, 12);
		const header_crc = Bun.hash.crc32(header.subarray(4, -4));
		header.writeUInt32BE(header_crc, 21);

		//data
		const data_deflate = deflateSync(this.#canvas,
			{ level: 5, windowBits: 15, memLevel: 9 }); //add deflate header and footer, level 4-5
		const data = Buffer.concat([
			BuPNG.#PNG_IDAT,
			data_deflate,
			Buffer.allocUnsafe(4),  //for crc
		]);
		data.writeUInt32BE(data_deflate.length, 0);
		const data_crc = Bun.hash.crc32(data.subarray(4, -4));
		data.writeUInt32BE(data_crc, data.length - 4);

		this.#png_buf = Buffer.concat([
			BuPNG.#PNG_SIGN,
			header,
			data,
			BuPNG.#PNG_IEND,
		]);
		this.#mustRebuild = false;
		return true;
	}

	plotPixel(x = 0, y = 0, r = 0, g = 0, b = 0, a = 255): boolean {
		const offset = (this.#width * BuPNG.#PIXEL_SIZE + BuPNG.#FILTER_SIZE) * y +
						x * BuPNG.#PIXEL_SIZE + BuPNG.#FILTER_SIZE;
		this.#canvas[offset] = r;
		this.#canvas[offset + 1] = g;
		this.#canvas[offset + 2] = b;
		this.#canvas[offset + 3] = a;		//0-transparent 255-opaque
		this.#mustRebuild = true;	//canvas was modified, must rebuild
		return true;
	}

	plotLine(x0 = 0, y0 = 0, x1 = 0, y1 = 0, r = 0, g = 0, b = 0, a = 255): boolean {
		//A Rasterizing Algorithm for Drawing Curves
		//Alois Zingl
	
		let dx = Math.abs(x1 - x0);
		let dy = -Math.abs(y1 - y0);
		let sx = (x0 < x1) ? 1 : -1;
		let sy = (y0 < y1) ? 1 : -1;
		let err = dx + dy, e2: number;
	
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

	getBase64(): string {
		if (this.#mustRebuild) this.#buildPNG();
		return `data:image/png;base64,${this.#png_buf.toString('base64')}`;
	}

	getFile(): Blob {
		if (this.#mustRebuild) this.#buildPNG();
		return new Blob([ this.#png_buf ], { type: 'image/png' });
	}

	get version(): string {
		return BuPNG.#VERSION;
	}
}

export { BuPNG };
