import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const coversDir = path.resolve(__dirname, "../../data/family-covers");

const TYPES = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function ensureCoversDir() {
  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
  }
}

export function coverUrl(filename) {
  return filename ? `/api/covers/${filename}` : "";
}

export function saveCoverFromDataUrl(familyId, dataUrl) {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    throw Object.assign(new Error("사진 파일이 올바르지 않습니다."), { status: 400 });
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    throw Object.assign(new Error("지원하지 않는 사진 형식입니다."), { status: 400 });
  }

  const ext = TYPES[match[1].toLowerCase()];
  if (!ext) {
    throw Object.assign(new Error("jpg, png, webp만 올릴 수 있습니다."), { status: 400 });
  }

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length < 80) {
    throw Object.assign(new Error("사진이 너무 작습니다."), { status: 400 });
  }
  if (buffer.length > 6 * 1024 * 1024) {
    throw Object.assign(new Error("사진은 6MB 이하로 올려 주세요."), { status: 400 });
  }

  removeCoversForFamily(familyId);
  ensureCoversDir();
  const filename = `${Number(familyId)}.${ext}`;
  fs.writeFileSync(path.join(coversDir, filename), buffer);
  return filename;
}

export function saveCoverFromFile(familyId, sourcePath) {
  ensureCoversDir();
  const ext = path.extname(sourcePath).replace(".", "").toLowerCase() || "jpg";
  const filename = `${Number(familyId)}.${ext}`;
  const dest = path.join(coversDir, filename);
  const temp = path.join(coversDir, `${Number(familyId)}.tmp.${ext}`);
  fs.copyFileSync(sourcePath, temp);
  removeCoversForFamily(familyId, path.basename(temp));
  fs.renameSync(temp, dest);
  return filename;
}

export function removeCover(filename) {
  if (!filename) {
    return;
  }
  const target = path.join(coversDir, path.basename(filename));
  if (fs.existsSync(target)) {
    fs.unlinkSync(target);
  }
}

export function removeCoversForFamily(familyId, keepName = "") {
  ensureCoversDir();
  const prefix = `${Number(familyId)}`;
  for (const name of fs.readdirSync(coversDir)) {
    if (keepName && name === keepName) {
      continue;
    }
    const base = path.parse(name).name;
    if (base === prefix || base.startsWith(`${prefix}-`) || base.startsWith(`${prefix}.tmp`)) {
      fs.unlinkSync(path.join(coversDir, name));
    }
  }
}

export function sweepOrphanCovers(keepNames) {
  ensureCoversDir();
  const keep = new Set((keepNames || []).filter(Boolean).map((name) => path.basename(name)));
  for (const name of fs.readdirSync(coversDir)) {
    if (!keep.has(name)) {
      fs.unlinkSync(path.join(coversDir, name));
    }
  }
}
