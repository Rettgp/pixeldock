/* eslint-disable no-bitwise */
export interface BinaryVdfObject {
    [key: string]: string | number | bigint | BinaryVdfObject;
}

export class InvalidBinaryVdf extends Error {
    constructor(offset: number) {
        super(`InvalidBinaryVdf : unexpected data at offset ${offset}`);
    }
}

const TYPE_MAP = 0x00;
const TYPE_STRING = 0x01;
const TYPE_INT32 = 0x02;
const TYPE_FLOAT32 = 0x03;
const TYPE_UINT64 = 0x07;
const TYPE_END = 0x08;
const TYPE_INT64 = 0x0a;

function readCString(buf: Buffer, offset: number): [string, number] {
    const end = buf.indexOf(0, offset);
    if (end === -1) throw new InvalidBinaryVdf(offset);
    return [buf.toString('utf8', offset, end), end + 1];
}

function readMap(buf: Buffer, start: number): [BinaryVdfObject, number] {
    const result: BinaryVdfObject = {};
    let offset = start;

    while (offset < buf.length) {
        const type = buf[offset];
        offset += 1;
        if (type === TYPE_END) return [result, offset];

        const [key, afterKey] = readCString(buf, offset);
        offset = afterKey;

        switch (type) {
            case TYPE_MAP: {
                const [child, afterChild] = readMap(buf, offset);
                result[key] = child;
                offset = afterChild;
                break;
            }
            case TYPE_STRING: {
                const [value, afterValue] = readCString(buf, offset);
                result[key] = value;
                offset = afterValue;
                break;
            }
            case TYPE_INT32:
                result[key] = buf.readInt32LE(offset);
                offset += 4;
                break;
            case TYPE_FLOAT32:
                result[key] = buf.readFloatLE(offset);
                offset += 4;
                break;
            case TYPE_UINT64:
                result[key] = buf.readBigUInt64LE(offset);
                offset += 8;
                break;
            case TYPE_INT64:
                result[key] = buf.readBigInt64LE(offset);
                offset += 8;
                break;
            default:
                throw new InvalidBinaryVdf(offset);
        }
    }

    // Top-level maps may omit the trailing end marker
    return [result, offset];
}

export function parseBinaryVdf(buf: Buffer): BinaryVdfObject {
    return readMap(buf, 0)[0];
}

// Steam is inconsistent about key casing (AppName vs appname)
export function getKey(obj: BinaryVdfObject, key: string): any {
    const lower = key.toLowerCase();
    const match = Object.keys(obj).find((k) => k.toLowerCase() === lower);
    return match === undefined ? undefined : obj[match];
}
