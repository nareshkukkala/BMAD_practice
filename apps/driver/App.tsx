import React,{useEffect,useState}from'react';import{ActivityIndicator,Linking,ScrollView,StatusBar,StyleSheet,Text,TextInput,TouchableOpacity,View}from'react-native';
const API=process.env.EXPO_PUBLIC_API_URL||'http://localhost:3000';type Any=Record<string,any>;
const DEMO_START={lat:19.0760,lng:72.8777},DEMO_END={lat:19.0896,lng:72.8656};
export default function App(){const[token,setToken]=useState(''),[online,setOnline]=useState(false),[offers,setOffers]=useState<Any[]>([]),[trip,setTrip]=useState<Any|null>(null),[pin,setPin]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[eligibility,setEligibility]=useState('approved'),[history,setHistory]=useState<Any[]>([]),[documents,setDocuments]=useState({identity:'',vehicle:'',license:''});const call=async(path:string,method='GET',body?:Any)=>{const r=await fetch(API+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});const d=await r.json();if(!r.ok)throw Error(d.message||'Could not complete that action.');return d};const run=async(f:()=>Promise<any>)=>{setBusy(true);setMessage('');try{await f()}catch(e:any){setMessage(e.message)}finally{setBusy(false)}};const login=()=>run(async()=>{const x=await call('/api/auth/demo','POST',{handle:'ravi',code:'424242'});setToken(x.token);setMessage('Phone verified · Signed in as Ravi.')});const emergency=()=>Linking.openURL(`tel:${process.env.EXPO_PUBLIC_EMERGENCY_NUMBER||'112'}`).catch(()=>setMessage('Could not open the device dialer.'));const refresh=()=>run(async()=>{const o=await call('/api/offers');setOffers(o);const a=await call('/api/availability');setOnline(!!a[0]?.online);const d=await call('/api/driver');if(d[0])setEligibility(d[0].status);if(trip){const t=await call(`/api/trip/${trip.id}`);setTrip(t)}else{const trips=await call('/api/trip');const active=trips.find((x:Any)=>['Assigned','Driver arrived','In progress'].includes(x.status));if(active)setTrip(active)}});useEffect(()=>{if(token)refresh()},[token]);useEffect(()=>{if(!token)return;const timer=setInterval(async()=>{try{const nextOffers=await call('/api/offers');setOffers(nextOffers);if(trip?.id){setTrip(await call(`/api/trip/${trip.id}`))}else{const rows=await call('/api/trip');const active=rows.find((x:Any)=>['Assigned','Driver arrived','In progress'].includes(x.status));if(active)setTrip(active)}}catch{/* Retain current state through a transient connection loss. */}},5000);return()=>clearInterval(timer)},[token,trip?.id,trip?.status]);
useEffect(()=>{if(!trip?.id||!['Assigned','Driver arrived','In progress'].includes(trip.status))return;const tripId=trip.id,epoch=trip.trackingEpoch;const assignedAt=(trip.timeline||[]).find((te:Any)=>te.state==='Assigned')?.at;const startedAt=Date.parse(assignedAt||trip.createdAt||'')||Date.now();const DURATION_MS=180000/* demo-only placeholder: assumed full pickup-to-drop-off span for interpolation, not a real ETA */,SAMPLE_INTERVAL_MS=4000/* demo-only placeholder: simulated GPS sample cadence */;const sendSample=()=>{const fraction=Math.max(0,Math.min(1,(Date.now()-startedAt)/DURATION_MS));const lat=DEMO_START.lat+(DEMO_END.lat-DEMO_START.lat)*fraction,lng=DEMO_START.lng+(DEMO_END.lng-DEMO_START.lng)*fraction;call('/api/driver/location','POST',{tripId,epoch,sequence:Date.now(),lat,lng}).then((x:Any)=>{if(!x.accepted)setMessage('Location update was rejected or failed.')}).catch(()=>setMessage('Location update was rejected or failed.'))};sendSample();const timer=setInterval(sendSample,SAMPLE_INTERVAL_MS);return()=>clearInterval(timer)},[trip?.id,trip?.status,trip?.trackingEpoch]);const Button=({title,onPress,primary=false}:any)=><TouchableOpacity accessibilityRole="button" style={[s.button,primary&&s.primary]} onPress={onPress}><Text style={[s.buttonText,primary&&s.primaryText]}>{title}</Text></TouchableOpacity>;const action=(name:string,extra:Any={})=>run(async()=>{const currentTrip=trip;if(!currentTrip)throw Error('There is no active trip to update.');const x=await call('/api/driver/trip-action','POST',{tripId:currentTrip.id,action:name,expectedVersion:currentTrip.version,requestId:`${name}-${currentTrip.id}-${currentTrip.version}`,...extra});setTrip(x);setPin('')});
const padKeys=['1','2','3','4','5','6','7','8','9','Delete','0','Clear'];
const pressKey=(key:string)=>{if(key==='Delete')setPin(p=>p.slice(0,-1));else if(key==='Clear')setPin('');else setPin(p=>p.length<4?p+key:p)};
const Keypad=()=><View style={s.pad} accessibilityLabel="PIN keypad">{padKeys.map(key=>{const isDigit=key!=='Delete'&&key!=='Clear';const disabled=isDigit&&pin.length>=4;return <TouchableOpacity key={key} disabled={disabled} accessibilityRole="button" accessibilityState={{disabled}} accessibilityLabel={key==='Delete'?'Delete last digit':key==='Clear'?'Clear PIN':`Digit ${key}`} style={[s.key,disabled&&s.keyDisabled]} onPress={()=>pressKey(key)}><Text style={s.keyText}>{key}</Text></TouchableOpacity>})}</View>;
return <ScrollView style={s.page} contentContainerStyle={s.content}>
<StatusBar barStyle="light-content"/>
<Text style={s.eyebrow}>RIDE PILOT · DRIVER</Text>
<Text style={s.title}>Stay focused. Know your next step.</Text>
{!token?
<View style={s.card}>
  <Text style={s.heading}>Driver sign in</Text>
  <Text>Demo account · Ravi · code 424242</Text>
  <Button title="Continue as Ravi" onPress={login} primary/>
</View>
:
<>
<View style={s.card}>
  <Text style={s.heading}>Driver eligibility</Text>
  <Text>{eligibility==='approved'?'Approved · Documents valid':`Application · ${eligibility}`}</Text>
  <Text>History and support remain available if eligibility changes.</Text>
  <Button title={online?'Go offline':'Go online'} onPress={()=>run(async()=>{await call('/api/driver/set-online','POST',{online:!online});setOnline(!online)})} primary/>
  <Text>{online?'Online · Available for offers':'Offline'}</Text>
</View>
<View style={s.card}>
  <Text style={s.heading}>Document checklist</Text>
  {(['identity','vehicle','license'] as const).map(k=><View key={k}><Text style={s.label}>{k[0].toUpperCase()+k.slice(1)} document</Text><TextInput style={s.input} value={documents[k]} onChangeText={v=>setDocuments({...documents,[k]:v})} placeholder="Demo text to encrypt and submit" secureTextEntry/></View>)}
  <Button title="Submit for review" onPress={()=>run(async()=>{if(Object.values(documents).some(v=>!v.trim()))throw Error('Add every required document before submitting.');const v=await call('/api/driver/document-submit','POST',{idempotencyKey:'ravi-application',documents:Object.fromEntries(Object.entries(documents).map(([k,v])=>[k,btoa(v)]))});setEligibility(v.status);setOnline(false);setMessage(`Application ${v.status} · Operations will review your documents.`)})}/>
</View>
{trip?
<View style={s.card}>
  <Text style={s.eyebrow}>TRIP · {String(trip.status).toUpperCase()}</Text>
  <Text style={s.heading}>{trip.status==='Assigned'?'Navigate to pickup':trip.status==='Driver arrived'?'Enter the rider’s PIN':trip.status}</Text>
  <Text>{trip.pickupNote||trip.pickup}</Text>
  <Text>{trip.pickup} → {trip.destination}</Text>
  <View style={s.actions}>
    {trip.status==='Assigned'?
    <>
      <Button title="Record arrival" onPress={()=>action('arrive')} primary/>
      <Button title="Cancel this trip before pickup" onPress={()=>action('driver_cancel',{reason:'Driver cancelled before pickup'})}/>
    </>:null}
    {trip.status==='Driver arrived'?
    <>
      <View style={s.panel}>
        <Text style={s.panelLabel}>Rider pickup PIN</Text>
        <Text style={s.idText} accessibilityLiveRegion="polite">{Array.from({length:4},(_,i)=>pin[i]||'•').join(' ')}</Text>
      </View>
      <Keypad/>
      <Button title="Verify and start trip" onPress={()=>action('start',{pin})} primary/>
      <Button title="Report rider no-show" onPress={()=>action('no_show')}/>
    </>:null}
    {trip.status==='In progress'?
    <>
      <Button title="Complete trip" onPress={()=>action('complete')} primary/>
      <Button title="End early with reason" onPress={()=>action('end',{earlyEnd:true,reason:'Rider requested early drop-off'})}/>
    </>:null}
    {['Assigned','Driver arrived','In progress'].includes(trip.status)?
    <>
      <Button title="Report an issue" onPress={()=>run(async()=>{const x=await call('/api/driver/incident','POST',{tripId:trip.id,category:'safety',description:'Driver report',requestId:`incident-${trip.id}-${Date.now()}`});setMessage(`Report received · ${x.id}`)})}/>
      <Text style={s.label} accessibilityLiveRegion="polite">Location sharing · automatic</Text>
      <Button title="Call emergency services" onPress={emergency}/>
    </>:null}
    <Button title="Refresh authoritative trip" onPress={refresh}/>
  </View>
</View>:null}
<View style={s.card}>
  <Text style={s.heading}>Nearby ride offers</Text>
  <Button title="Refresh offers" onPress={refresh}/>
  {offers.map(o=><View key={o.id} style={s.offer}><Text style={s.eta}>Pickup · {o.etaMinutes||4} min</Text><Text>{o.pickup} → {o.destination}</Text><Text>Offer expires on server time</Text><Button title="Accept offer" onPress={()=>run(async()=>{const x=await call('/api/driver/accept-offer','POST',{tripId:o.id,requestId:`accept-${o.id}-${o.version}`});setTrip(x);setOffers([])})} primary/></View>)}
</View>
<View style={s.card}>
  <Text style={s.heading}>Earnings and payouts</Text>
  <Button title="Trip history" onPress={()=>run(async()=>{setHistory(await call('/api/trip'))})}/>
  {history.map((item:Any)=><Button key={item.id} title={`${item.status} · ${item.pickup} → ${item.destination}`} onPress={()=>setTrip(item)}/>)}
  <Button title="Open earnings" onPress={()=>run(async()=>{const rows=await call('/api/earning');setMessage(JSON.stringify(rows))})}/>
  <Button title="Payout status" onPress={()=>run(async()=>{const rows=await call('/api/payout');setMessage(JSON.stringify(rows))})}/>
</View>
</>}
{busy?<ActivityIndicator color="#96e6d4"/>:null}
{message?<Text accessibilityLiveRegion="polite" style={s.message}>{message}</Text>:null}
</ScrollView>}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#142428'},content:{padding:20,paddingTop:52,gap:14,maxWidth:700,width:'100%',alignSelf:'center'},eyebrow:{fontSize:13,fontWeight:'700',letterSpacing:1.5,color:'#96e6d4'},title:{fontSize:30,fontWeight:'800',color:'#f2f8f6',lineHeight:37},card:{backgroundColor:'#1d3236',borderRadius:16,borderWidth:1,borderColor:'#536b6d',padding:18,gap:12},heading:{fontSize:21,fontWeight:'700',color:'#f2f8f6'},label:{fontWeight:'700',color:'#f2f8f6'},input:{borderWidth:1,borderColor:'#9ab1ae',borderRadius:8,padding:12,fontSize:17,minHeight:56,color:'#f2f8f6'},button:{minHeight:56,borderRadius:8,borderWidth:1,borderColor:'#b4c7c4',justifyContent:'center',alignItems:'center',padding:12},primary:{backgroundColor:'#96e6d4',borderColor:'#96e6d4'},buttonText:{fontSize:16,fontWeight:'700',color:'#f2f8f6'},primaryText:{color:'#142428'},offer:{borderTopWidth:1,borderColor:'#536b6d',paddingTop:12,gap:9},eta:{fontSize:24,fontWeight:'800',color:'#f2f8f6'},actions:{gap:10},message:{color:'#ffd0ba',fontWeight:'600'},panel:{borderWidth:1,borderColor:'#536b6d',borderRadius:8,padding:14,gap:6,backgroundColor:'#142428'},panelLabel:{fontSize:13,color:'#c0d4cf',fontWeight:'700'},idText:{fontSize:32,fontWeight:'800',letterSpacing:4,fontVariant:['tabular-nums'],color:'#f2f8f6'},pad:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:6},key:{width:'31%',minHeight:56,borderRadius:8,borderWidth:1,borderColor:'#b4c7c4',justifyContent:'center',alignItems:'center'},keyDisabled:{opacity:0.4},keyText:{fontSize:20,fontWeight:'700',color:'#f2f8f6'}});
