import { Event } from "../models/Event.js";
import { Family } from "../models/Family.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^$|^([01]\d|2[0-3]):[0-5]\d$/;
const COLORS = ["#d9a394", "#e0b25a", "#8fb8a0", "#8aa4c8", "#b89aa8"];

function monthRange(year, month) {
  const y = Number(year);
  const m = Number(month);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const last = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { from: start, to: end };
}

function parsePayload(body) {
  const title = String(body?.title || "").trim();
  const description = String(body?.description || "").trim();
  const eventDate = String(body?.eventDate || "").trim();
  const endDate = String(body?.endDate || body?.eventDate || "").trim();
  const startTime = String(body?.startTime || "").trim();
  const endTime = String(body?.endTime || "").trim();
  const color = String(body?.color || COLORS[0]).trim();

  if (!title) {
    return { error: "일정 제목을 입력해 주세요." };
  }
  if (!DATE_PATTERN.test(eventDate) || !DATE_PATTERN.test(endDate)) {
    return { error: "날짜 형식이 올바르지 않습니다." };
  }
  if (endDate < eventDate) {
    return { error: "종료 날짜는 시작 날짜보다 빠를 수 없습니다." };
  }
  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
    return { error: "시간 형식이 올바르지 않습니다." };
  }
  if (!COLORS.includes(color)) {
    return { error: "선택할 수 없는 색상입니다." };
  }

  return {
    value: {
      title,
      description,
      eventDate,
      endDate,
      startTime,
      endTime,
      color,
      isFamilyEvent: Boolean(body?.isFamilyEvent),
    },
  };
}

export function listEvents(req, res) {
  let from = String(req.query.from || "");
  let to = String(req.query.to || "");

  if (!from || !to) {
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    if (!year || !month) {
      return res.status(400).json({ message: "조회 기간(from, to) 또는 year, month가 필요합니다." });
    }
    const range = monthRange(year, month);
    from = range.from;
    to = range.to;
  }

  if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) {
    return res.status(400).json({ message: "조회 기간 형식이 올바르지 않습니다." });
  }

  const events = Event.findVisible({ from, to });
  const families = Family.findAll().map((family) => ({
    id: family.id,
    name: family.name,
    color: family.color,
    isClan: family.isClan,
  }));
  return res.json({ events, families });
}

export function getEvent(req, res) {
  const event = Event.findById(req.params.id);
  if (!event || !Event.canAccess(event, req.user)) {
    return res.status(404).json({ message: "일정을 찾을 수 없습니다." });
  }
  return res.json({ event });
}

export function createEvent(req, res) {
  const parsed = parsePayload(req.body);
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }

  const clan = Family.clan();
  const house = Family.findById(req.user.familyId);
  const familyId = house && !house.isClan ? house.id : clan?.id;
  if (!familyId) {
    return res.status(400).json({ message: "일정을 올릴 가족이 없습니다." });
  }

  const event = Event.create({
    ...parsed.value,
    createdBy: req.user.id,
    familyId,
  });

  return res.status(201).json({ event });
}

export function updateEvent(req, res) {
  const current = Event.findById(req.params.id);
  if (!current) {
    return res.status(404).json({ message: "일정을 찾을 수 없습니다." });
  }
  if (!Event.canEdit(current, req.user)) {
    return res.status(403).json({ message: "이 일정을 수정할 권한이 없습니다." });
  }

  const parsed = parsePayload(req.body);
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }

  const event = Event.update(current.id, parsed.value);
  return res.json({ event });
}

export function deleteEvent(req, res) {
  const current = Event.findById(req.params.id);
  if (!current) {
    return res.status(404).json({ message: "일정을 찾을 수 없습니다." });
  }
  if (!Event.canEdit(current, req.user)) {
    return res.status(403).json({ message: "이 일정을 삭제할 권한이 없습니다." });
  }

  Event.delete(current.id);
  return res.json({ message: "일정을 삭제했습니다." });
}
