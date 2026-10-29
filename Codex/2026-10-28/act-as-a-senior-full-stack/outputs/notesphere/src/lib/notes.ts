import { query, one } from "./db";
export const noteSelect = `SELECT n.*,s.name subject,c.name course,u.name uploader,u.avatar,
 f.mime,f.size,f.original_name,
 COALESCE((SELECT round(avg(r.rating),1)::float FROM reviews r WHERE r.note_id=n.id),0) rating,
 (SELECT count(*)::int FROM reviews r WHERE r.note_id=n.id) review_count,
 (SELECT count(*)::int FROM events e WHERE e.note_id=n.id AND kind='view') views,
 (SELECT count(*)::int FROM events e WHERE e.note_id=n.id AND kind='download') downloads,
 (SELECT count(*)::int FROM bookmarks b WHERE b.note_id=n.id) bookmark_count,
 EXISTS(SELECT 1 FROM bookmarks b WHERE b.note_id=n.id AND b.user_id=$1::uuid) bookmarked,
 COALESCE((SELECT string_agg(t.name,',') FROM tags t JOIN note_tags nt ON nt.tag_id=t.id WHERE nt.note_id=n.id),'') tags
 FROM notes n JOIN users u ON u.id=n.user_id JOIN subjects s ON s.id=n.subject_id JOIN courses c ON c.id=n.course_id JOIN files f ON f.note_id=n.id`;
export async function getNote(id: string, uid: string | null) {
  return one(noteSelect + " WHERE n.id=$2::uuid", [uid, id]);
}
export async function searchNotes(params: URLSearchParams, u: any) {
  const values: any[] = [u?.id || null];
  const conditions: string[] = [];
  const add = (sql: string, value: any) => {
    values.push(value);
    conditions.push(sql.replaceAll("?", `$${values.length}`));
  };
  const mode = params.get("mode");
  if (mode === "uploads") {
    add("n.user_id=?", u?.id);
  } else {
    conditions.push(
      "((n.status='approved' AND n.visibility='public') OR n.user_id=$1::uuid)",
    );
    if (mode === "bookmarks")
      conditions.push(
        "EXISTS(SELECT 1 FROM bookmarks b WHERE b.note_id=n.id AND b.user_id=$1::uuid)",
      );
    if (mode === "history")
      conditions.push(
        "EXISTS(SELECT 1 FROM events e WHERE e.note_id=n.id AND e.user_id=$1::uuid)",
      );
  }
  let rank = "n.created_at DESC";
  const q = params.get("q")?.trim().slice(0, 150);
  if (q) {
    values.push(q);
    const p = `$${values.length}`;
    conditions.push(
      `(to_tsvector('english',n.title||' '||n.description||' '||n.topic) @@ websearch_to_tsquery('english',${p}) OR concat_ws(' ',s.name,c.name,u.name,(SELECT string_agg(t.name,' ') FROM tags t JOIN note_tags nt ON nt.tag_id=t.id WHERE nt.note_id=n.id)) ILIKE '%'||${p}||'%')`,
    );
    rank = `ts_rank(to_tsvector('english',n.title||' '||n.description||' '||n.topic),websearch_to_tsquery('english',${p})) DESC,n.created_at DESC`;
  }
  for (const [k, col] of Object.entries({
    subject: "n.subject_id",
    course: "n.course_id",
    semester: "n.semester",
    college: "n.college",
    branch: "n.branch",
    year: "n.academic_year",
    type: "f.mime",
    status: "n.status",
  })) {
    const v = params.get(k);
    if (v) add(`${col}=?`, v);
  }
  if (params.get("days"))
    add(
      "n.created_at>now()-(? || ' days')::interval",
      String(Math.min(365, Math.max(1, Number(params.get("days")) || 30))),
    );
  if (params.get("rating"))
    add(
      "(SELECT COALESCE(avg(r.rating),0) FROM reviews r WHERE r.note_id=n.id)>=?",
      Number(params.get("rating")) || 0,
    );
  if (params.get("collection"))
    add(
      "EXISTS(SELECT 1 FROM collection_notes cn JOIN collections cl ON cl.id=cn.collection_id WHERE cn.note_id=n.id AND cl.user_id=$1::uuid AND cl.id=?::uuid)",
      params.get("collection"),
    );
  const sorts: Record<string, string> = {
    recent: "n.created_at DESC",
    rating: "rating DESC, review_count DESC",
    views: "views DESC",
    downloads: "downloads DESC",
    bookmarks: "bookmark_count DESC",
    title: "n.title ASC",
    saved:
      "(SELECT b.created_at FROM bookmarks b WHERE b.note_id=n.id AND b.user_id=$1::uuid) DESC",
    history:
      "(SELECT max(e.created_at) FROM events e WHERE e.note_id=n.id AND e.user_id=$1::uuid) DESC",
  };
  rank = sorts[params.get("sort") || ""] || rank;
  const page = Math.max(1, Math.min(10000, Number(params.get("page")) || 1));
  // Insert window count before FROM rather than appending after joins.
  const select = noteSelect.replace(
    "SELECT n.*",
    "SELECT COUNT(*) OVER()::int total,n.*",
  );
  const notes = await query(
    select +
      " WHERE " +
      conditions.join(" AND ") +
      " ORDER BY " +
      rank +
      ` LIMIT 12 OFFSET ${(page - 1) * 12}`,
    values,
  );
  return { notes, total: notes[0]?.total || 0, page };
}
