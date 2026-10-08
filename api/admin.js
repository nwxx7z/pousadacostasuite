const { neon } = require('@neondatabase/serverless');
function db(){if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL não configurada');return neon(process.env.DATABASE_URL)}
function auth(req){return !!process.env.ADMIN_PASSWORD && req.headers['x-admin-password']===process.env.ADMIN_PASSWORD}
module.exports=async function(req,res){
 try{
  const sql=db();
  if(req.method==='GET'){
   const rooms=await sql`SELECT id,number,name FROM rooms WHERE active=true ORDER BY number`;
   const prices=await sql`SELECT id,room_id,price,start_date::text,end_date::text FROM prices ORDER BY start_date`;
   const blocks=await sql`SELECT id,room_id,reason,start_date::text,end_date::text FROM availability_blocks ORDER BY start_date`;
   return res.status(200).json({rooms,prices,blocks});
  }
  if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});
  if(!auth(req))return res.status(401).json({error:'Senha inválida'});
  const b=req.body||{},a=b.action,start=b.start_date,end=b.end_date;
  if(['add_price','add_block'].includes(a)&&(!start||!end||start>end))return res.status(400).json({error:'Período inválido'});
  if(a==='add_price'){
   if(!(b.price>=0))return res.status(400).json({error:'Valor inválido'});
   const overlap=await sql`SELECT id FROM prices WHERE room_id=${b.room_id} AND daterange(start_date,end_date,'[]') && daterange(${start}::date,${end}::date,'[]') LIMIT 1`;
   if(overlap.length)return res.status(409).json({error:'Já existe um preço sobreposto nesse período.'});
   await sql`INSERT INTO prices(room_id,price,start_date,end_date) VALUES(${b.room_id},${b.price},${start},${end})`;
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