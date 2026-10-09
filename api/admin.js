const { neon } = require('@neondatabase/serverless');
function db(){if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL não configurada');return neon(process.env.DATABASE_URL)}
async function init(sql){
 await sql`CREATE TABLE IF NOT EXISTS rooms (id SERIAL PRIMARY KEY, number INTEGER UNIQUE NOT NULL, name TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT true)`;
 await sql`CREATE TABLE IF NOT EXISTS prices (id SERIAL PRIMARY KEY, room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE, price NUMERIC(10,2) NOT NULL, price_triple NUMERIC(10,2), start_date DATE NOT NULL, end_date DATE NOT NULL, CHECK(end_date >= start_date))`;
 await sql`ALTER TABLE prices ADD COLUMN IF NOT EXISTS price_triple NUMERIC(10,2)`;
 await sql`CREATE TABLE IF NOT EXISTS availability_blocks (id SERIAL PRIMARY KEY, room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE, reason TEXT, start_date DATE NOT NULL, end_date DATE NOT NULL, CHECK(end_date >= start_date))`;
 await sql`INSERT INTO rooms(number,name) VALUES (1,'Suíte Casal'),(2,'Suíte Casal'),(3,'Suíte Casal'),(4,'Suíte Quádrupla'),(5,'Suíte com Vista para o Mar'),(6,'Suíte com Varanda e Vista para o Mar'),(7,'Suíte com Varanda e Vista para o Mar') ON CONFLICT(number) DO NOTHING`;
 await sql`INSERT INTO prices(room_id,price,start_date,end_date) SELECT id,144.00,'2026-10-08','2026-12-22' FROM rooms WHERE number IN (1,2,3) AND NOT EXISTS (SELECT 1 FROM prices p WHERE p.room_id=rooms.id AND p.start_date='2026-10-08' AND p.end_date='2026-12-22')`;
 await sql`INSERT INTO prices(room_id,price,start_date,end_date) SELECT id,342.00,'2026-10-09','2026-10-12' FROM rooms WHERE number=4 AND NOT EXISTS (SELECT 1 FROM prices p WHERE p.room_id=rooms.id AND p.start_date='2026-10-09' AND p.end_date='2026-10-12')`;
 await sql`INSERT INTO prices(room_id,price,start_date,end_date) SELECT id,252.00,'2026-10-13','2026-10-30' FROM rooms WHERE number=4 AND NOT EXISTS (SELECT 1 FROM prices p WHERE p.room_id=rooms.id AND p.start_date='2026-10-13' AND p.end_date='2026-10-30')`;
 await sql`INSERT INTO prices(room_id,price,start_date,end_date) SELECT id,396.00,'2026-10-31','2026-10-31' FROM rooms WHERE number=4 AND NOT EXISTS (SELECT 1 FROM prices p WHERE p.room_id=rooms.id AND p.start_date='2026-10-31' AND p.end_date='2026-10-31')`;
 await sql`INSERT INTO prices(room_id,price,price_triple,start_date,end_date) SELECT id,171.00,243.00,'2026-10-13','2026-10-30' FROM rooms WHERE number IN (5,7) AND NOT EXISTS (SELECT 1 FROM prices p WHERE p.room_id=rooms.id AND p.start_date='2026-10-13' AND p.end_date='2026-10-30')`;
 await sql`INSERT INTO prices(room_id,price,price_triple,start_date,end_date) SELECT id,171.00,243.00,'2026-11-01','2026-11-19' FROM rooms WHERE number IN (5,7) AND NOT EXISTS (SELECT 1 FROM prices p WHERE p.room_id=rooms.id AND p.start_date='2026-11-01' AND p.end_date='2026-11-19')`;
 await sql`INSERT INTO prices(room_id,price,price_triple,start_date,end_date) SELECT id,223.62,319.50,'2026-11-20','2026-11-21' FROM rooms WHERE number IN (5,7) AND NOT EXISTS (SELECT 1 FROM prices p WHERE p.room_id=rooms.id AND p.start_date='2026-11-20' AND p.end_date='2026-11-21')`;
 await sql`INSERT INTO prices(room_id,price,price_triple,start_date,end_date) SELECT id,171.00,243.00,'2026-11-22','2026-12-22' FROM rooms WHERE number IN (5,7) AND NOT EXISTS (SELECT 1 FROM prices p WHERE p.room_id=rooms.id AND p.start_date='2026-11-22' AND p.end_date='2026-12-22')`;
}
function auth(req){return !!process.env.ADMIN_PASSWORD && req.headers['x-admin-password']===process.env.ADMIN_PASSWORD}
module.exports=async function(req,res){
 try{
  const sql=db();
  await init(sql);
  if(req.method==='GET'){
   const rooms=await sql`SELECT id,number,name FROM rooms WHERE active=true ORDER BY number`;
   const prices=await sql`SELECT id,room_id,price,price_triple,start_date::text,end_date::text FROM prices ORDER BY start_date`;
   const blocks=await sql`SELECT id,room_id,reason,start_date::text,end_date::text FROM availability_blocks ORDER BY start_date`;
   return res.status(200).json({rooms,prices,blocks});
  }
  if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});
  if(!auth(req))return res.status(401).json({error:'Senha inválida'});
  const b=req.body||{},a=b.action,start=b.start_date,end=b.end_date;
  if(['add_price','add_block'].includes(a)&&(!start||!end||start>end))return res.status(400).json({error:'Período inválido'});
  if(a==='add_price'){
   if(!(b.price>=0))return res.status(400).json({error:'Valor de casal/principal inválido'});
   if(b.price_triple!==null && b.price_triple!==undefined && b.price_triple!=='' && !(Number(b.price_triple)>=0))return res.status(400).json({error:'Valor triplo inválido'});
   const overlap=await sql`SELECT id FROM prices WHERE room_id=${b.room_id} AND daterange(start_date,end_date,'[]') && daterange(${start}::date,${end}::date,'[]') LIMIT 1`;
   if(overlap.length)return res.status(409).json({error:'Já existe um preço sobreposto nesse período.'});
   const triple=(b.price_triple===null||b.price_triple===undefined||b.price_triple==='')?null:Number(b.price_triple);
   await sql`INSERT INTO prices(room_id,price,price_triple,start_date,end_date) VALUES(${b.room_id},${b.price},${triple},${start},${end})`;
  } else if(a==='delete_price') await sql`DELETE FROM prices WHERE id=${b.id}`;
  else if(a==='add_block'){
   const overlap=await sql`SELECT id FROM availability_blocks WHERE room_id=${b.room_id} AND daterange(start_date,end_date,'[]') && daterange(${start}::date,${end}::date,'[]') LIMIT 1`;
   if(overlap.length)return res.status(409).json({error:'Já existe um bloqueio sobreposto nesse período.'});
   await sql`INSERT INTO availability_blocks(room_id,reason,start_date,end_date) VALUES(${b.room_id},${b.reason||null},${start},${end})`;
  } else if(a==='delete_block') await sql`DELETE FROM availability_blocks WHERE id=${b.id}`;
  else return res.status(400).json({error:'Ação inválida'});
  return res.status(200).json({ok:true});
 }catch(e){console.error(e);return res.status(500).json({error:e.message||'Erro interno'})}
}