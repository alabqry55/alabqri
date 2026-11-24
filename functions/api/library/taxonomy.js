const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "allow": "GET"
  }
});

const TABLES = {
  sections: {
    name: "library_sections",
    columns: ["id", "name", "sort_order", "active"],
    sql: "SELECT id,name,sort_order,active FROM library_sections ORDER BY sort_order ASC,id ASC"
  },
  specialties: {
    name: "library_specialties",
    columns: ["id", "name", "sort_order", "active", "primary_section_id"],
    sql: "SELECT id,name,sort_order,active,primary_section_id FROM library_specialties ORDER BY sort_order ASC,id ASC"
  },
  contentTypes: {
    name: "library_content_types",
    columns: ["id", "name", "sort_order", "active"],
    sql: "SELECT id,name,sort_order,active FROM library_content_types ORDER BY sort_order ASC,id ASC"
  },
  classifications: {
    name: "library_article_classification",
    columns: ["article_id", "primary_section_id", "primary_specialty_id", "content_type_id"],
    sql: "SELECT article_id,primary_section_id,primary_specialty_id,content_type_id FROM library_article_classification WHERE article_id IN (SELECT id FROM articles WHERE scheduled_at IS NULL OR julianday(scheduled_at) <= julianday('now')) ORDER BY article_id ASC",
    legacySql: "SELECT article_id,primary_section_id,primary_specialty_id,content_type_id FROM library_article_classification WHERE article_id IN (SELECT id FROM articles) ORDER BY article_id ASC"
  }
};

async function tableColumns(db, tableName) {
  const result = await db.prepare("PRAGMA table_info(" + tableName + ")").all();
  return new Set((result.results || []).map(column => String(column.name || "")));
}

async function readRows(db, table) {
  try {
    return await db.prepare(table.sql).all();
  } catch (error) {
    // Older article tables may not have the scheduling column yet. In that
    // schema the public articles API also treats every article as immediate.
    if (table.legacySql && /no such column:\s*scheduled_at/i.test(String(error?.message || error))) {
      return db.prepare(table.legacySql).all();
    }
    throw error;
  }
}

export async function onRequest({ request, env }) {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" }, 405);
  }
  if (!env.DB) {
    return json({
      available: false,
      code: "D1_NOT_CONFIGURED",
      sections: [],
      specialties: [],
      contentTypes: [],
      classifications: []
    }, 503);
  }

  try {
    const existing = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('library_sections','library_specialties','library_content_types','library_article_classification')"
    ).all();
    const existingNames = new Set((existing.results || []).map(row => String(row.name || "")));
    const missingTables = Object.values(TABLES)
      .map(table => table.name)
      .filter(name => !existingNames.has(name));

    if (missingTables.length) {
      return json({
        available: false,
        code: "TAXONOMY_NOT_INSTALLED",
        missingTables,
        sections: [],
        specialties: [],
        contentTypes: [],
        classifications: []
      }, 503);
    }

    const tableEntries = Object.entries(TABLES);
    const columnSets = await Promise.all(
      tableEntries.map(([, table]) => tableColumns(env.DB, table.name))
    );
    const missingColumns = [];
    for (let index = 0; index < tableEntries.length; index++) {
      const [key, table] = tableEntries[index];
      for (const column of table.columns) {
        if (!columnSets[index].has(column)) {
          missingColumns.push({ table: table.name, column, collection: key });
        }
      }
    }

    if (missingColumns.length) {
      return json({
        available: false,
        code: "TAXONOMY_SCHEMA_INCOMPLETE",
        missingColumns,
        sections: [],
        specialties: [],
        contentTypes: [],
        classifications: []
      }, 503);
    }

    const rows = await Promise.all(
      tableEntries.map(([, table]) => readRows(env.DB, table))
    );
    const payload = { available: true };
    for (let index = 0; index < tableEntries.length; index++) {
      const [key] = tableEntries[index];
      payload[key] = rows[index].results || [];
    }
    return json(payload);
  } catch (error) {
    const requestId = crypto.randomUUID();
    console.error("[library-taxonomy-api] request failed", requestId, error);
    return json({
      available: false,
      error: "تعذر قراءة تصنيفات المكتبة من قاعدة البيانات.",
      code: "TAXONOMY_READ_FAILED",
      requestId,
      sections: [],
      specialties: [],
      contentTypes: [],
      classifications: []
    }, 500);
  }
}
