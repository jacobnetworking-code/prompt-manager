import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"}
const allowed=new Set(["startup","sync","missing_data","prompt_edit","chains","backup","account","quality","feature","other"])
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors})
  if(req.method!=="POST")return Response.json({error:"Method not allowed"},{status:405,headers:cors})
  try{
    const auth=req.headers.get("Authorization")||""
    const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!
    const client=createClient(url,anon,{global:{headers:{Authorization:auth}}})
    const {data:{user},error:userError}=await client.auth.getUser()
    if(userError||!user)return Response.json({error:"Unauthorized"},{status:401,headers:cors})
    const body=await req.json(); const category=String(body?.category||"other"); const message=String(body?.message||"").trim()
    if(!allowed.has(category)||!message||message.length>5000)return Response.json({error:"Invalid message"},{status:400,headers:cors})
    const apiKey=Deno.env.get("RESEND_API_KEY"),from=Deno.env.get("SUPPORT_FROM_EMAIL"),to=Deno.env.get("SUPPORT_TO_EMAIL")||"jacob.networking@gmail.com"
    if(!apiKey||!from)throw new Error("Support email is not configured")
    const technical=body?.technical&&typeof body.technical==="object"?body.technical:{}
    const safeTechnical={app_version:technical.app_version,language:technical.language,online:technical.online,display_mode:technical.display_mode,user_agent:technical.user_agent,viewport:technical.viewport,origin:technical.origin,timestamp:technical.timestamp}
    const text=[`Prompt Manager support message`,`Category: ${category}`,`User: ${user.email||"(no email)"}`,`User ID: ${user.id}`,"",message,"","Technical information:",JSON.stringify(safeTechnical,null,2)].join("\n")
    const mail=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[to],subject:`Prompt Manager Support · ${category}`,text})})
    if(!mail.ok)throw new Error(`Email provider error ${mail.status}`)
    return Response.json({ok:true},{headers:cors})
  }catch(error){console.error(error);return Response.json({error:"Could not send support message"},{status:500,headers:cors})}
})
