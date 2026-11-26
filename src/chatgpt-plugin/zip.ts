import { crc32, deflateRawSync, inflateRawSync } from "node:zlib";

export type ZipEntry = {
  path: string;
  data: Buffer;
};

const LOCAL = 0x04034b50;
const CENTRAL = 0x02014b50;
const END = 0x06054b50;

/** Write a ZIP of regular files. Paths must already be relative and use `/`. */
export function createZip(files: ZipEntry[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.path, "utf8");
    const checksum = crc32(file.data) >>> 0;
    const compressed = deflateRawSync(file.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(LOCAL, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    const localRecord = Buffer.concat([local, name, compressed]);
    locals.push(localRecord);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(CENTRAL, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(Buffer.concat([central, name]));
    offset += localRecord.length;
  }

  const centralDir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(END, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDir.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, centralDir, end]);
}

export function readZip(buffer: Buffer): ZipEntry[] {
  const files: ZipEntry[] = [];
  let offset = 0;
  while (offset + 4 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (signature === CENTRAL || signature === END) break;
    if (signature !== LOCAL) {
      throw new Error("archive_format_not_zip: not a ZIP local header");
    }
    if (offset + 30 > buffer.length) {
      throw new Error("archive_format_not_zip: truncated local header");
    }
    const flags = buffer.readUInt16LE(offset + 6);
    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    if ((flags & 0x1) !== 0) {
      throw new Error("archive_member_unreadable: encrypted entries are not allowed");
    }
    if ((flags & 0x8) !== 0) {
      throw new Error("archive_member_unreadable: data descriptors are not allowed");
    }
    const nameStart = offset + 30;
    const nameEnd = nameStart + nameLength;
    const dataStart = nameEnd + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > buffer.length) {
      throw new Error("archive_format_not_zip: truncated entry");
    }
    const path = buffer.toString("utf8", nameStart, nameEnd);
    const compressed = buffer.subarray(dataStart, dataEnd);
    let data: Buffer;
    if (path.endsWith("/")) {
      data = Buffer.alloc(0);
    } else if (method === 0) {
      data = Buffer.from(compressed);
    } else if (method === 8) {
      data = inflateRawSync(compressed);
    } else {
      throw new Error(`archive_member_unreadable: unsupported compression method ${method}`);
    }
    if (!path.endsWith("/")) files.push({ path, data });
    offset = dataEnd;
  }
  if (files.length === 0 && buffer.length < 22) {
    throw new Error("archive_format_not_zip: not a ZIP archive");
  }
  return files;
}
