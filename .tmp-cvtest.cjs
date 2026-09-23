(async () => {
  const login = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@smart-school.in", password: "Admin@123", schoolCode: "DEFAULT" }),
    redirect: "manual",
  });
  const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
  console.log("login:", login.status, "cookie?", !!cookie);
  if (!cookie) process.exit(1);
  const H = { "Content-Type": "application/json", "Cookie": cookie, "x-school-id": "1" };

  const payload = {
    name: "Test CV Student",
    dob: "2010-04-15",
    gender: "Male",
    address: "Test Street, City",
    education: [{ school: "ABC PS", board: "CBSE", year: "2019-2020", percentage: "92" }],
    achievements: "Won math olympiad",
    skills: "Coding, Chess",
    hobbies: "Reading, Cricket",
  };
  let r = await fetch("http://localhost:3000/api/student-cv", { method: "POST", headers: H, body: JSON.stringify(payload) });
  const created = await r.json();
  console.log("create:", r.status, "| id:", created.id, "| edu[0].school:", created.education?.[0]?.school);

  const pid = created.id;
  r = await fetch("http://localhost:3000/api/student-cv?id=" + pid, { headers: H });
  const one = await r.json();
  console.log("get by id:", r.status, "| skills:", one.skills, "| edu len:", Array.isArray(one.education) ? one.education.length : "N/A");

  r = await fetch("http://localhost:3000/api/student-cv", { method: "PUT", headers: H, body: JSON.stringify({ id: pid, hobbies: "Swimming" }) });
  const upd = await r.json();
  console.log("update:", r.status, "| hobbies:", upd.hobbies);

  r = await fetch("http://localhost:3000/api/student-cv?ids=" + pid, { method: "DELETE", headers: H });
  console.log("delete:", r.status, JSON.stringify(await r.json()));

  r = await fetch("http://localhost:3000/api/student-cv", { headers: H });
  const list = await r.json();
  const left = Array.isArray(list) ? list.filter(x => x.name === "Test CV Student" || x.id === pid).length : -1;
  console.log("leftover:", left);
})().catch(e => { console.error("ERR", e.message); process.exit(1); });
