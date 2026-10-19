const BASE = process.env.BASE_URL || 'http://localhost:3000';
const SUF = Date.now().toString().slice(-6);
let pass = 0, fail = 0;
const failures = [];

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

function check(name, actual, expected, extra) {
  const ok = actual === expected && (extra ? extra() : true);
  if (ok) { pass++; console.log(`  ✅ ${name}`); }
  else {
    fail++; failures.push(name);
    console.log(`  ❌ ${name}  (esperado ${expected}, obtenido ${actual})`);
  }
}

const validChar = (alias, extra = {}) => ({
  real_name: 'Test Person', alias, main_power: 'Testing', power_level: 50, ...extra,
});

async function main() {
  const teamIds = [], charIds = [];

  console.log('\n== TEAMS: CRUD básico ==');
  let r = await call('GET', '/teams');
  check('GET /teams → 200', r.status, 200, () => Array.isArray(r.data) && r.data.length >= 6);
  r = await call('GET', '/teams/1');
  check('GET /teams/1 → 200', r.status, 200, () => r.data.name === 'Avengers');
  r = await call('GET', '/teams/1/characters');
  check('GET /teams/1/characters → 200', r.status, 200, () => Array.isArray(r.data) && r.data.length >= 5);

  r = await call('POST', '/teams', { name: `Team A ${SUF}`, base: 'Base', founded_year: 2000, active: true });
  check('POST /teams → 201', r.status, 201);
  const teamA = r.data?.id; teamIds.push(teamA);

  r = await call('PUT', `/teams/${teamA}`, { name: `Team A2 ${SUF}`, base: 'Nueva', founded_year: 2001, active: true });
  check('PUT /teams/:id → 200', r.status, 200, () => r.data.name === `Team A2 ${SUF}`);

  console.log('\n== Regla 1: 404 si no existe ==');
  for (const [m, p, b] of [
    ['GET', '/teams/99999'], ['GET', '/teams/99999/characters'],
    ['PUT', '/teams/99999', { name: 'x', active: true }],
    ['PATCH', '/teams/99999/characters', { characterIds: [] }],
    ['DELETE', '/teams/99999'],
    ['GET', '/characters/99999'],
    ['PUT', '/characters/99999', validChar('zz', { status: 'ACTIVE', is_villain: false })],
    ['PATCH', '/characters/99999/status', { status: 'ACTIVE' }],
    ['DELETE', '/characters/99999'],
  ]) {
    r = await call(m, p, b);
    check(`${m} ${p} → 404`, r.status, 404);
  }

  console.log('\n== Regla 2: duplicados → 409 ==');
  r = await call('POST', '/teams', { name: 'Avengers' });
  check('POST team con name repetido → 409', r.status, 409);
  r = await call('PUT', `/teams/${teamA}`, { name: 'Avengers', active: true });
  check('PUT team con name de otro equipo → 409', r.status, 409);
  r = await call('PUT', `/teams/${teamA}`, { name: `Team A2 ${SUF}`, active: true });
  check('PUT team con su propio name → 200 (no es conflicto)', r.status, 200);

  r = await call('POST', '/characters', validChar(`Hero ${SUF}`));
  check('POST /characters → 201', r.status, 201, () => r.data.status === 'ACTIVE');
  const hero = r.data?.id; charIds.push(hero);
  r = await call('POST', '/characters', validChar('Iron Man'));
  check('POST character con alias repetido → 409', r.status, 409);
  r = await call('PUT', `/characters/${hero}`, validChar('Thor', { status: 'ACTIVE', is_villain: false }));
  check('PUT character con alias de otro → 409', r.status, 409);

  console.log('\n== Regla 3: validación power_level / status → 400 ==');
  for (const [label, body] of [
    ['power_level 0', validChar('v1', { power_level: 0 })],
    ['power_level 101', validChar('v2', { power_level: 101 })],
    ['power_level texto', validChar('v3', { power_level: 'alto' })],
    ['status inválido', validChar('v4', { status: 'DEAD' })],
    ['faltan campos', { alias: 'v5' }],
  ]) {
    r = await call('POST', '/characters', body);
    check(`POST character ${label} → 400`, r.status, 400);
  }
  r = await call('PATCH', `/characters/${hero}/status`, { status: 'DEAD' });
  check('PATCH status inválido → 400', r.status, 400);
  r = await call('PUT', `/characters/${hero}`, validChar(`Hero ${SUF}`, { power_level: 500, status: 'ACTIVE', is_villain: false }));
  check('PUT power_level 500 → 400', r.status, 400);
  r = await call('GET', '/characters?status=DEAD');
  check('GET ?status inválido → 400', r.status, 400);
  r = await call('POST', '/teams', {});
  check('POST team sin name → 400', r.status, 400);

  console.log('\n== Regla 4: team_id debe existir (404) y estar activo (400) ==');
  r = await call('POST', '/characters', validChar('t1', { team_id: 99999 }));
  check('POST character team_id inexistente → 404', r.status, 404);
  r = await call('POST', '/characters', validChar('t2', { team_id: 6 }));
  check('POST character team_id inactivo (Thunderbolts) → 400', r.status, 400);
  r = await call('PUT', `/characters/${hero}`, validChar(`Hero ${SUF}`, { status: 'ACTIVE', is_villain: false, team_id: 99999 }));
  check('PUT character team_id inexistente → 404', r.status, 404);
  r = await call('PUT', `/characters/${hero}`, validChar(`Hero ${SUF}`, { status: 'ACTIVE', is_villain: false, team_id: 6 }));
  check('PUT character team_id inactivo → 400', r.status, 400);
  r = await call('PUT', `/characters/${hero}`, validChar(`Hero ${SUF}`, { status: 'ACTIVE', is_villain: false, team_id: teamA }));
  check('PUT character con team activo → 200', r.status, 200, () => r.data.team?.id === teamA);
  r = await call('GET', `/characters/${hero}`);
  check('GET /characters/:id incluye datos del equipo', r.status, 200, () => r.data.team?.name?.startsWith('Team A2'));

  console.log('\n== Regla 5: asignar personajes ==');
  r = await call('POST', '/characters', validChar(`Solo ${SUF}`));
  const solo = r.data?.id; charIds.push(solo);
  r = await call('POST', '/teams', { name: `Team B ${SUF}`, characterIds: [solo, 99999] });
  check('POST team con characterIds inexistente → 404', r.status, 404);
  r = await call('GET', '/teams');
  check('  …y el equipo NO quedó creado', r.status, 200, () => !r.data.some(t => t.name === `Team B ${SUF}`));
  r = await call('POST', '/teams', { name: `Team B ${SUF}`, active: false, characterIds: [solo] });
  check('POST team inactivo con characterIds → 400', r.status, 400);
  r = await call('POST', '/teams', { name: `Team B ${SUF}`, characterIds: [solo] });
  check('POST team con characterIds válidos → 201', r.status, 201);
  const teamB = r.data?.id; teamIds.push(teamB);
  r = await call('GET', `/teams/${teamB}/characters`);
  check('  …el personaje quedó en el equipo', r.status, 200, () => r.data.some(c => c.id === solo));

  r = await call('PATCH', `/teams/${teamA}/characters`, { characterIds: [solo] });
  check('PATCH asignar (reasigna desde otro equipo) → 200', r.status, 200);
  r = await call('GET', `/teams/${teamB}/characters`);
  check('  …ya no está en el equipo anterior', r.status, 200, () => !r.data.some(c => c.id === solo));
  r = await call('GET', `/teams/${teamA}/characters`);
  check('  …sí está en el nuevo', r.status, 200, () => r.data.some(c => c.id === solo));
  r = await call('PATCH', `/teams/${teamA}/characters`, { characterIds: [99999] });
  check('PATCH con personaje inexistente → 404', r.status, 404);
  r = await call('PATCH', `/teams/6/characters`, { characterIds: [solo] });
  check('PATCH a equipo inactivo → 400', r.status, 400);
  r = await call('PATCH', `/teams/${teamA}/characters`, { characterIds: 'x' });
  check('PATCH body inválido → 400', r.status, 400);

  console.log('\n== Filtros GET /characters ==');
  r = await call('GET', '/characters?status=RETIRED');
  check('?status=RETIRED → 200', r.status, 200, () => r.data.length >= 3 && r.data.every(c => c.status === 'RETIRED'));
  r = await call('GET', '/characters?teamId=1');
  check('?teamId=1 → 200', r.status, 200, () => r.data.length >= 5 && r.data.every(c => c.team_id === 1));
  r = await call('GET', '/characters?teamId=1&status=RETIRED');
  check('?teamId=1&status=RETIRED → 200 (combinados)', r.status, 200, () => r.data.length === 2);

  console.log('\n== Regla 6: borrar equipo ==');
  r = await call('DELETE', `/teams/${teamA}`);
  check('DELETE equipo con personajes → 409', r.status, 409);
  r = await call('PUT', `/teams/${teamA}`, { name: `Team A2 ${SUF}`, active: false });
  check('PUT active:false (cerrar equipo) → 200', r.status, 200, () => r.data.active === false);

  console.log('\n== Regla 7: RETIRED → INJURED ==');
  r = await call('PATCH', '/characters/1/status', { status: 'INJURED' });
  check('PATCH RETIRED→INJURED (Iron Man) → 400', r.status, 400);
  r = await call('GET', '/characters/1');
  check('  …el estado NO cambió', r.status, 200, () => r.data.status === 'RETIRED');
  r = await call('PUT', '/characters/1', {
    real_name: 'Tony Stark', alias: 'Iron Man', main_power: 'Powered armor suit',
    power_level: 85, status: 'INJURED', is_villain: false, team_id: 1,
  });
  check('PUT RETIRED→INJURED → 400', r.status, 400);
  r = await call('POST', '/characters', validChar(`Ret ${SUF}`, { status: 'RETIRED' }));
  const ret = r.data?.id; charIds.push(ret);
  r = await call('PATCH', `/characters/${ret}/status`, { status: 'ACTIVE' });
  check('PATCH RETIRED→ACTIVE → 200', r.status, 200, () => r.data.status === 'ACTIVE');
  r = await call('PATCH', `/characters/${ret}/status`, { status: 'RETIRED' });
  r = await call('PATCH', `/characters/${ret}/status`, { status: 'MISSING' });
  check('PATCH RETIRED→MISSING → 200 (permitido)', r.status, 200);
  r = await call('PATCH', `/characters/${hero}/status`, { status: 'INJURED' });
  check('PATCH ACTIVE→INJURED → 200', r.status, 200, () => r.data.status === 'INJURED');

  console.log('\n== Casos borde ==');
  r = await call('GET', '/teams/abc');
  check('GET /teams/abc → 400', r.status, 400);
  r = await call('GET', '/teams/99999999999');
  check('GET /teams/99999999999 (id fuera de rango int4) → 404 (no 500)', r.status, 404);
  r = await call('POST', '/characters', { ...validChar('extra'), campo_extra: 1 });
  check('POST con campo no permitido → 400', r.status, 400);

  console.log('\n== Limpieza (DELETE → 200) ==');
  for (const id of charIds) {
    r = await call('DELETE', `/characters/${id}`);
    check(`DELETE /characters/${id} → 200`, r.status, 200);
  }
  for (const id of teamIds) {
    r = await call('DELETE', `/teams/${id}`);
    check(`DELETE /teams/${id} → 200`, r.status, 200);
  }
  r = await call('GET', `/characters/${charIds[0]}`);
  check('Personaje borrado ya no existe → 404', r.status, 404);

  console.log(`\n========== ${pass} OK, ${fail} fallos ==========`);
  if (fail) { console.log('Fallos:\n - ' + failures.join('\n - ')); process.exit(1); }
}

main().catch(e => {
  console.error('\nNo se pudo conectar a la API. ¿Está corriendo en', BASE, '?\n', e.message);
  process.exit(2);
});
