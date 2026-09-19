import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"}
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors})
  if(req.method!=="POST")return Response.json({error:"Method not allowed"},{status:405,headers:cors})
  try{
    const body=await req.json();if(body?.confirm!=="DELETE")return Response.json({error:"Confirmation required"},{status:400,headers:cors})
    const auth=req.headers.get("Authorization")||"",url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}})
    const {data:{user},error:userError}=await userClient.auth.getUser()
    if(userError||!user)return Response.json({error:"Unauthorized"},{status:401,headers:cors})
    const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}})
    const uid=user.id
    // Delete child/owned data first. Every operation must succeed before the Auth user is removed.
    for(const [table,column] of [["prompt_chain_steps","user_id"],["prompt_chains","user_id"],["prompt_share_contents","owner_user_id"],["prompt_shares","owner_user_id"],["prompts","user_id"]] as const){
      const {error}=await admin.from(table).delete().eq(column,uid);if(error)throw new Error(`${table}: ${error.message}`)
    }
    const {error:deleteError}=await admin.auth.admin.deleteUser(uid)
    if(deleteError)throw deleteError
    return Response.json({ok:true},{headers:cors})
  }catch(error){console.error(error);return Response.json({error:"Account deletion failed"},{status:500,headers:cors})}
})
