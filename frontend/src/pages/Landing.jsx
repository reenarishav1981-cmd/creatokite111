import FAQ from "../components/FAQ";
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Counter({ end, suffix='', duration=2000 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; obs.disconnect();
      let cur=0; const step=end/(duration/16);
      const t=setInterval(()=>{ cur=Math.min(cur+step,end); setVal(Math.floor(cur)); if(cur>=end) clearInterval(t); },16);
    },{ threshold:0.3 });
    if (ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  },[end,duration]);
  return <span ref={ref}>{val.toLocaleString('en-IN')}{suffix}</span>;
}

function Particle() {
  const canvas = useRef(null);
  useEffect(()=>{
    const c=canvas.current; if(!c) return;
    const ctx=c.getContext('2d'); let anim;
    const resize=()=>{ c.width=window.innerWidth; c.height=Math.min(window.innerHeight,800); };
    resize(); window.addEventListener('resize',resize);
    const pts=Array.from({length:50},()=>({
      x:Math.random()*c.width, y:Math.random()*c.height,
      vx:(Math.random()-.5)*.35, vy:(Math.random()-.5)*.35,
      r:Math.random()*1.4+.4, o:Math.random()*.35+.08,
      col:Math.random()>.5?'108,99,255':'0,217,255',
    }));
    const draw=()=>{
      ctx.clearRect(0,0,c.width,c.height);
      pts.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=c.width; if(p.x>c.width)p.x=0;
        if(p.y<0)p.y=c.height; if(p.y>c.height)p.y=0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${p.col},${p.o})`; ctx.fill();
      });
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const d=Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y);
        if(d<110){ ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle=`rgba(108,99,255,${.07*(1-d/110)})`; ctx.stroke(); }
      }
      anim=requestAnimationFrame(draw);
    };
    draw();
    return()=>{ cancelAnimationFrame(anim); window.removeEventListener('resize',resize); };
  },[]);
  return <canvas ref={canvas} style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0}}/>;
}

const WORDS=['Campaigns','Creators','ROI','Impact'];
const FLOW=[
  {icon:'🏢',n:'01',t:'Brand Submits Brief',d:'Describe your goals, budget & audience. No creator browsing, no DMs, no spreadsheets.'},
  {icon:'🤖',n:'02',t:'AI Analyzes & Matches',d:'Our AI scores 12,000+ creators on 12 parameters — niche fit, engagement quality, authenticity, growth rate.'},
  {icon:'⚡',n:'03',t:'Admin Curates & Assigns',d:'Our team reviews AI suggestions, finalizes the mix, and bulk-assigns creators to your campaign.'},
  {icon:'🎯',n:'04',t:'Creators Execute',d:'Selected creators receive the brief, accept, create content, and submit through the platform.'},
  {icon:'📊',n:'05',t:'Live Analytics',d:'Real-time performance tracking with AI insights. We optimize mid-campaign for maximum ROI.'},
];
const FEATURES=[
  {i:'🧠',t:'AI Creator Matching',d:'12-parameter scoring engine analyzes every creator for niche fit, engagement quality, audience authenticity, and ROI potential.',tag:'Core AI',span:2},
  {i:'🛡️',t:'Trust Score System',d:'5-dimensional Trust Score. Fake follower detection, bot analysis, and delivery history built-in.',tag:'Safety'},
  {i:'⚙️',t:'Campaign OS',d:'Full workflow automation — brief to analytics. Admin assigns, creators execute.',tag:'Workflow'},
  {i:'💰',t:'Escrow Payments',d:'Brand pays platform. Creator delivers. Admin approves. Auto-release. Zero fraud.',tag:'Payments'},
  {i:'🏆',t:'Creator Gamification',d:'XP, levels, ranks, badges. Top creators get priority assignment to premium campaigns.',tag:'Gamification'},
];

export default function Landing() {
  const nav=useNavigate();
  const [wi,setWi]=useState(0);
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{
    const t=setInterval(()=>setWi(i=>(i+1)%WORDS.length),2200);
    return()=>clearInterval(t);
  },[]);
  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>50);
    window.addEventListener('scroll',fn); return()=>window.removeEventListener('scroll',fn);
  },[]);

  const S={fontFamily:'var(--fb)',color:'var(--t1)'};

  return (
    <div style={{...S,background:'var(--bg)',minHeight:'100vh',overflowX:'hidden'}}>
      {/* NAV */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:1000,height:60,
        display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 40px',
        background:scrolled?'rgba(4,5,10,0.92)':'transparent',
        backdropFilter:scrolled?'blur(20px)':'none',
        borderBottom:scrolled?'1px solid var(--border)':'none',transition:'all .3s'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:28,height:28,borderRadius:7,background:'linear-gradient(135deg,var(--p),var(--acc))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>⚡</div>
          <span style={{fontFamily:'var(--fd)',fontWeight:800,fontSize:16}}>Creatokite</span>
          <span style={{fontSize:9,color:'var(--acc)',border:'1px solid rgba(0,217,255,0.3)',borderRadius:4,padding:'1px 5px'}}>AI OS</span>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={()=>nav('/login')} style={{background:'none',border:'none',color:'var(--t2)',cursor:'pointer',padding:'7px 14px',borderRadius:7,fontSize:13}} onMouseEnter={e=>e.target.style.color='var(--t1)'} onMouseLeave={e=>e.target.style.color='var(--t2)'}>Sign In</button>
          <button onClick={()=>nav('/register')} style={{background:'linear-gradient(135deg,var(--p),#5b52d4)',border:'none',color:'#fff',cursor:'pointer',padding:'8px 18px',borderRadius:7,fontSize:13,fontWeight:600,boxShadow:'0 0 20px rgba(108,99,255,.3)'}}>Get Started →</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{position:'relative',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'120px 40px 80px',textAlign:'center',overflow:'hidden'}}>
        <Particle/>
        <div style={{position:'absolute',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(108,99,255,.1),transparent 70%)',top:'5%',left:'50%',transform:'translateX(-50%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:7,padding:'5px 14px',background:'rgba(108,99,255,.1)',border:'1px solid rgba(108,99,255,.3)',borderRadius:100,marginBottom:28,fontSize:11,color:'var(--p2)'}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:'var(--acc)',display:'inline-block',animation:'pulse 2s infinite'}}/>
            India's First AI Creator Campaign OS
          </div>
          <h1 style={{fontSize:'clamp(2.2rem,5.5vw,4.2rem)',fontFamily:'var(--fd)',fontWeight:900,lineHeight:1.1,marginBottom:20,letterSpacing:'-1px'}}>
            Intelligent{' '}
            <span style={{background:'linear-gradient(90deg,var(--p2),var(--acc))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              {WORDS[wi]}
            </span>
            <br/>for Modern Brands
          </h1>
          <p style={{fontSize:'clamp(14px,2vw,17px)',color:'var(--t2)',maxWidth:520,margin:'0 auto 36px',lineHeight:1.75}}>
            Brands submit goals. AI selects creators. Admin assigns. Platform tracks everything.<br/>
            <strong style={{color:'var(--t1)'}}>No direct brand-creator contact. Just results.</strong>
          </p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:56}}>
            <button onClick={()=>nav('/register?role=brand')} style={{padding:'13px 26px',background:'linear-gradient(135deg,var(--p),#5b52d4)',border:'none',borderRadius:9,color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer',boxShadow:'0 8px 28px rgba(108,99,255,.35)',transition:'all .2s',fontFamily:'var(--fb)'}} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e=>e.currentTarget.style.transform=''}>🏢 Launch a Campaign</button>
            <button onClick={()=>nav('/register?role=creator')} style={{padding:'13px 26px',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.12)',borderRadius:9,color:'var(--t1)',fontWeight:600,fontSize:14,cursor:'pointer',transition:'all .2s',fontFamily:'var(--fb)'}} onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.3)'} onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.12)'}>✨ Join as Creator →</button>
          </div>
          {/* Stats bar */}
          <div style={{display:'flex',gap:0,justifyContent:'center',flexWrap:'wrap',background:'rgba(255,255,255,.03)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden',maxWidth:640,margin:'0 auto'}}>
            {[{l:'Creators',v:12000,s:'+',c:'var(--p2)'},{l:'Campaigns',v:847,s:'',c:'var(--acc)'},{l:'Paid Out (₹)',v:2,s:'Cr+',c:'var(--acc2)'},{l:'Avg ROI',v:320,s:'%',c:'var(--gold)'}].map(({l,v,s,c},i)=>(
              <div key={l} style={{flex:1,minWidth:120,padding:'18px 12px',textAlign:'center',borderRight:i<3?'1px solid var(--border)':'none'}}>
                <div style={{fontFamily:'var(--fd)',fontWeight:800,fontSize:22,color:c}}><Counter end={v} suffix={s}/></div>
                <div style={{fontSize:10,color:'var(--t2)',marginTop:3}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{padding:'90px 40px',maxWidth:960,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:52}}>
          <div style={{fontSize:11,color:'var(--acc)',letterSpacing:3,textTransform:'uppercase',marginBottom:10}}>The Workflow</div>
          <h2 style={{fontSize:'clamp(1.6rem,3.5vw,2.4rem)',fontFamily:'var(--fd)',fontWeight:800,marginBottom:12}}>How Creatokite Works</h2>
          <p style={{color:'var(--t2)',maxWidth:420,margin:'0 auto',fontSize:14}}>Fully managed. Brands never contact creators. We handle the entire pipeline.</p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {FLOW.map((f,i)=>(
            <div key={f.n} style={{display:'grid',gridTemplateColumns:'1fr 72px 1fr',alignItems:'center'}}>
              {i%2===0?(
                <>
                  <div style={{padding:'20px 28px 20px 0',textAlign:'right'}}>
                    <div style={{fontSize:10,color:'var(--p2)',letterSpacing:2,marginBottom:6}}>STEP {f.n}</div>
                    <h3 style={{fontSize:15,marginBottom:6,color:'var(--t1)'}}>{f.t}</h3>
                    <p style={{fontSize:12,color:'var(--t2)',lineHeight:1.65}}>{f.d}</p>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                    <div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,rgba(108,99,255,.2),rgba(0,217,255,.1))',border:'1px solid rgba(108,99,255,.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,boxShadow:'0 0 20px rgba(108,99,255,.2)'}}>{f.icon}</div>
                    {i<FLOW.length-1&&<div style={{width:1,height:36,background:'linear-gradient(180deg,rgba(108,99,255,.4),transparent)'}}/>}
                  </div>
                  <div/>
                </>
              ):(
                <>
                  <div/>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                    <div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,rgba(0,217,255,.2),rgba(0,255,163,.1))',border:'1px solid rgba(0,217,255,.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,boxShadow:'0 0 20px rgba(0,217,255,.2)'}}>{f.icon}</div>
                    {i<FLOW.length-1&&<div style={{width:1,height:36,background:'linear-gradient(180deg,rgba(0,217,255,.4),transparent)'}}/>}
                  </div>
                  <div style={{padding:'20px 0 20px 28px'}}>
                    <div style={{fontSize:10,color:'var(--acc)',letterSpacing:2,marginBottom:6}}>STEP {f.n}</div>
                    <h3 style={{fontSize:15,marginBottom:6,color:'var(--t1)'}}>{f.t}</h3>
                    <p style={{fontSize:12,color:'var(--t2)',lineHeight:1.65}}>{f.d}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section style={{padding:'80px 40px',background:'var(--s1)'}}>
        <div style={{maxWidth:1000,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <div style={{fontSize:11,color:'var(--p2)',letterSpacing:3,textTransform:'uppercase',marginBottom:10}}>Platform Intelligence</div>
            <h2 style={{fontSize:'clamp(1.5rem,3vw,2.2rem)',fontFamily:'var(--fd)',fontWeight:800}}>Built for the Creator Economy</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
            {FEATURES.map((f,i)=>(
              <div key={f.t} onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(108,99,255,.35)';e.currentTarget.style.transform='translateY(-3px)';}} onMouseLeave={e=>{e.currentTarget.style.borderColor=i===0?'rgba(108,99,255,.25)':'var(--border)';e.currentTarget.style.transform='';}}
                style={{padding:24,borderRadius:14,transition:'all .25s',cursor:'default',
                  gridColumn:f.span?`span ${f.span}`:'',
                  background:i===0?'linear-gradient(135deg,rgba(108,99,255,.07),rgba(0,217,255,.03))':'rgba(255,255,255,.02)',
                  border:i===0?'1px solid rgba(108,99,255,.25)':'1px solid var(--border)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                  <span style={{fontSize:26}}>{f.i}</span>
                  <span style={{fontSize:9,padding:'3px 7px',borderRadius:6,background:'rgba(108,99,255,.12)',color:'var(--p2)',border:'1px solid rgba(108,99,255,.2)'}}>{f.tag}</span>
                </div>
                <h3 style={{fontSize:14,fontFamily:'var(--fd)',marginBottom:8,color:'var(--t1)'}}>{f.t}</h3>
                <p style={{fontSize:12,color:'var(--t2)',lineHeight:1.65}}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:'90px 40px',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,rgba(108,99,255,.08),transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1,maxWidth:520,margin:'0 auto'}}>
          <h2 style={{fontSize:'clamp(1.8rem,4vw,2.6rem)',fontFamily:'var(--fd)',fontWeight:900,marginBottom:14,lineHeight:1.2}}>Ready to Run Intelligent Campaigns?</h2>
          <p style={{color:'var(--t2)',fontSize:14,lineHeight:1.75,marginBottom:36}}>Join 500+ brands who replaced messy spreadsheets and DMs with Creatokite's AI Campaign OS.</p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={()=>nav('/register?role=brand')} style={{padding:'14px 30px',background:'linear-gradient(135deg,var(--p),var(--acc))',border:'none',borderRadius:9,color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer',boxShadow:'0 8px 28px rgba(108,99,255,.4)',transition:'all .2s',fontFamily:'var(--fb)'}} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e=>e.currentTarget.style.transform=''}>🚀 Launch Campaign</button>
            <button onClick={()=>nav('/register?role=creator')} style={{padding:'14px 30px',background:'transparent',border:'1px solid rgba(255,255,255,.15)',borderRadius:9,color:'var(--t1)',fontWeight:600,fontSize:14,cursor:'pointer',transition:'all .2s',fontFamily:'var(--fb)'}} onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.4)'} onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.15)'}>✨ Join as Creator</button>
          </div>
        </div>
      </section>
            <FAQ />

      {/* FOOTER */}
      <footer style={{borderTop:'1px solid var(--border)',padding:'22px 40px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          <div style={{width:22,height:22,borderRadius:6,background:'linear-gradient(135deg,var(--p),var(--acc))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10}}>⚡</div>
          <span style={{fontFamily:'var(--fd)',fontWeight:800,fontSize:14}}>Creatokite</span>
        </div>
        <div style={{fontSize:11,color:'var(--t3)'}}>© 2025 Creatokite — AI-Powered Creator Campaign OS · India</div>
        <div style={{display:'flex',gap:16}}>
          {['Privacy','Terms','Contact'].map(l=><span key={l} style={{fontSize:11,color:'var(--t3)',cursor:'pointer'}}>{l}</span>)}
        </div>
      </footer>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
