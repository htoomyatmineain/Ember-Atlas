import {spawn} from 'node:child_process';
const port='3101';const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',port],{stdio:['ignore','pipe','pipe']});
try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Preview startup timeout')),20000);server.on('exit',code=>{clearTimeout(timer);reject(Error('Preview exited '+code))});server.stdout.on('data',chunk=>{if(chunk.toString().includes('Ready')){clearTimeout(timer);resolve()}});});
 const smoke=spawn(process.execPath,['scripts/smoke-api.mjs'],{stdio:'inherit',env:{...process.env,SMOKE_BASE_URL:'http://127.0.0.1:'+port}});const code=await new Promise(resolve=>smoke.on('exit',resolve));if(code!==0)process.exitCode=1;
}finally{server.kill();}
