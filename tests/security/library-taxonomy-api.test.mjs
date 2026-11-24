import test from "node:test";
import assert from "node:assert/strict";
import { onRequest as taxonomyRequest } from "../../functions/api/library/taxonomy.js";

const SITE = "https://alabqri.example";

function taxonomyDb({ tables = true, complete = true } = {}) {
  const statements = [];
  const data = {
    library_sections: [{ id: "quran", name: "القرآن الكريم وعلومه", sort_order: 1, active: 1 }],
    library_specialties: [{ id: "quran-sciences", name: "علوم القرآن الكريم", sort_order: 1, active: 1, primary_section_id: "quran" }],
    library_content_types: [{ id: "article", name: "مقال", sort_order: 1, active: 1 }]
  };
  return {
    statements,
    prepare(sql) {
      const statement = String(sql).trim();
      statements.push(statement);
      return {
        async all() {
          if (statement.startsWith("SELECT name FROM sqlite_master")) {
            return { results: tables ? Object.keys(data).map(name => ({ name })) : [] };
          }
          if (statement.startsWith("PRAGMA table_info(")) {
            const name = statement.match(/^PRAGMA table_info\(([^)]+)\)$/)?.[1];
            const columns = {
              library_sections: ["id", "name", "sort_order", "active"],
              library_specialties: ["id", "name", "sort_order", "active", ...(complete ? ["primary_section_id"] : [])],
              library_content_types: ["id", "name", "sort_order", "active"]
            };
            return { results: (columns[name] || []).map(column => ({ name: column })) };
          }
          const table = Object.keys(data).find(name => statement.includes("FROM " + name + " "));
          if (table) return { results: data[table] };
          throw new Error("Unexpected query: " + statement);
        }
      };
    },
    async batch() { throw new Error("Taxonomy GET must never write."); }
  };
}

test("taxonomy endpoint returns ordered taxonomy collections using read-only queries", async () => {
  const db = taxonomyDb();
  const response = await taxonomyRequest({
    request: new Request(SITE + "/api/library/taxonomy"),
    env: { DB: db }
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.available, true);
  assert.equal(payload.sections[0].id, "quran");
  assert.equal(payload.specialties[0].primary_section_id, "quran");
  assert.equal(payload.contentTypes[0].id, "article");
  assert.ok(db.statements.every(sql => /^(SELECT|PRAGMA)\b/i.test(sql)), db.statements.join("\n"));
});

test("taxonomy endpoint reports missing migrations without attempting writes", async () => {
  const db = taxonomyDb({ tables: false });
  const response = await taxonomyRequest({
    request: new Request(SITE + "/api/library/taxonomy"),
    env: { DB: db }
  });
  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.equal(payload.available, false);
  assert.equal(payload.code, "TAXONOMY_NOT_INSTALLED");
  assert.deepEqual(payload.sections, []);
  assert.ok(db.statements.every(sql => /^(SELECT|PRAGMA)\b/i.test(sql)));
});

test("taxonomy endpoint detects an incomplete specialty schema before querying rows", async () => {
  const db = taxonomyDb({ complete: false });
  const response = await taxonomyRequest({
    request: new Request(SITE + "/api/library/taxonomy"),
    env: { DB: db }
  });
  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.equal(payload.code, "TAXONOMY_SCHEMA_INCOMPLETE");
  assert.ok(payload.missingColumns.some(item => item.table === "library_specialties" && item.column === "primary_section_id"));
  assert.equal(db.statements.some(sql => sql.startsWith("SELECT id,name,sort_order,active,primary_section_id FROM library_specialties")), false);
});

test("taxonomy endpoint rejects non-GET methods and missing D1 bindings", async () => {
  const methodResponse = await taxonomyRequest({
    request: new Request(SITE + "/api/library/taxonomy", { method: "POST" }),
    env: { DB: taxonomyDb() }
  });
  assert.equal(methodResponse.status, 405);
  const missingDbResponse = await taxonomyRequest({
    request: new Request(SITE + "/api/library/taxonomy"),
    env: {}
  });
  assert.equal(missingDbResponse.status, 503);
  assert.equal((await missingDbResponse.json()).code, "D1_NOT_CONFIGURED");
});
