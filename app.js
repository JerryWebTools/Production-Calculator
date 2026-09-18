(() => {
  const $ = id => document.getElementById(id);
  const KG_TO_LB = 2.2046;
  let activeLine = null;
  let activeMode = null;
  let extraEaValue = 0;
  let extraEaManuallyAdjusted = false;
  let saveCounter = 0;

  const packSize=$('packSize'), packUnit=$('packUnit'), pc=$('pc'), pcWrap=$('pcWrap'), ea=$('ea');
  const seedType=$('seedType'), regularSample=$('regularSample'), cropType=$('cropType');
  const rows=$('sampleRows'), noSamples=$('noSamples'), message=$('message');
  const num=el=>Number(el.value);
  const positive=el=>el.value!==''&&Number.isFinite(num(el))&&num(el)>0;

  function show(el, visible=true){ el.hidden=!visible; }
  function clearResults(){
    ['totalKg','totalLb','kgEa','resultEa','baseKg','overpackKg','regularKg','customKg','bagKg','bagLb','chemicalPct'].forEach(id=>$(id).textContent='—');
  }
  function kgFrom(weight,unit,seedPC){
    if(unit==='KG')return weight;
    if(unit==='G')return weight/1000;
    if(unit==='LB')return weight/KG_TO_LB;
    if(unit==='KS')return ((weight*1000)/seedPC)/KG_TO_LB;
    return 0;
  }
  function baseKgPerEa(){
    if(!positive(packSize)) return NaN;
    const size=num(packSize), count=num(pc);
    if(packUnit.value==='KG') return size;
    if(packUnit.value==='LB') return size/KG_TO_LB;
    if(!positive(pc)) return NaN;
    if(packUnit.value==='KS') return ((size*1000)/count)/KG_TO_LB;
    if(packUnit.value==='MS') return ((size*1000000)/count)/KG_TO_LB;
    return NaN;
  }
  function overpackRate(){
    if(activeLine===3 && activeMode==='pack' && cropType.value==='spinach') return 0.005;
    return seedType.value==='commercial' ? 0.01 : 0.005;
  }
  function chemicalRate(){
    if(activeLine!==3 || activeMode!=='pack') return 0;
    if(cropType.value==='normalCorn') return 0.01;
    if(cropType.value==='shrunkenCorn') return 0.012;
    return 0;
  }
  function suggestedExtra(orderEa){
    if(!Number.isFinite(orderEa) || orderEa<=0) return 0;
    return 1 + Math.ceil(orderEa/100);
  }
  function updateExtraSuggestion(force=false){
    if(activeLine!==3 || activeMode!=='pack') return;
    const order=positive(ea)?Math.floor(num(ea)):0;
    const suggestion=suggestedExtra(order);
    if(force || !extraEaManuallyAdjusted) extraEaValue=suggestion;
    $('extraEa').textContent=extraEaValue;
    $('extraSuggestion').textContent=order ? `Suggested: ${suggestion} Extra EA based on ${order} Order EA.` : 'Enter Order EA to calculate a suggestion.';
    $('orderEaDisplay').textContent=order||'—';
    $('extraEaDisplay').textContent='+'+extraEaValue;
    $('calculatedEaDisplay').textContent=order?order+extraEaValue:'—';
  }
  function updatePC(){
    const needed=['KS','MS'].includes(packUnit.value)||[...rows.querySelectorAll('.sample-unit')].some(x=>x.value==='KS');
    pcWrap.hidden=!needed;
  }
  function addSample(){
    if(rows.children.length>=10)return;
    const row=document.createElement('div');
    row.className='sample-row';
    row.innerHTML=`<label>Quantity<input class="sample-qty" type="number" min="1" step="1" inputmode="numeric" placeholder="6"></label><label>Weight each<input class="sample-weight" type="number" min="0" step="any" inputmode="decimal" placeholder="1"></label><label>Unit<select class="sample-unit"><option>KG</option><option>G</option><option>LB</option><option>KS</option></select></label><button type="button" class="secondary remove">Remove</button>`;
    rows.appendChild(row); noSamples.hidden=true;
    row.querySelector('.remove').addEventListener('click',()=>{row.remove();noSamples.hidden=rows.children.length>0;updatePC();calculate()});
    row.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',()=>{updatePC();calculate()}));
    calculate();
  }
  function customSamplesKg(seedPC){
    let custom=0, invalid=false;
    rows.querySelectorAll('.sample-row').forEach(row=>{
      const q=row.querySelector('.sample-qty'), w=row.querySelector('.sample-weight'), u=row.querySelector('.sample-unit').value;
      if(q.value===''&&w.value==='')return;
      if(!positive(q)||!positive(w)){invalid=true;return;}
      custom+=num(q)*kgFrom(num(w),u,seedPC);
    });
    return {custom,invalid};
  }
  function calculate(){
    message.hidden=true; updatePC();
    if(activeLine===3 && activeMode==='pack') updateExtraSuggestion();
    if(!positive(packSize)||!positive(ea)){clearResults();return null;}
    if(!pcWrap.hidden&&!positive(pc)){clearResults();message.textContent='Enter a valid Seed Count / PC to calculate seed-based quantities.';message.hidden=false;return null;}
    const kgEA=baseKgPerEa();
    if(!Number.isFinite(kgEA)||kgEA<=0){clearResults();return null;}
    const orderEa=Math.floor(num(ea));
    const calcEa=orderEa + ((activeLine===3&&activeMode==='pack')?extraEaValue:0);
    const rate=overpackRate();
    const base=kgEA*calcEa;
    const overpack=base*rate;
    const regular=Number(regularSample.value);
    const {custom,invalid}=customSamplesKg(num(pc));
    if(invalid){message.textContent='Complete Quantity and Weight for each custom sample, or remove the unused row.';message.hidden=false;}
    const raw=base+overpack+regular+custom;
    const roundedKg=Math.ceil(raw);
    const roundedLb=roundedKg*KG_TO_LB;
    const chem=chemicalRate();
    const bagTargetKg=kgEA*(1+rate)*(1+chem);
    const bagTargetLb=bagTargetKg*KG_TO_LB;

    $('kgEa').textContent=kgEA.toFixed(3)+' KG / '+(kgEA*KG_TO_LB).toFixed(2)+' LB';
    $('resultEa').textContent=calcEa.toLocaleString();
    $('baseKg').textContent=base.toFixed(3)+' KG / '+(base*KG_TO_LB).toFixed(2)+' LB';
    $('overpackKg').textContent=overpack.toFixed(3)+' KG / '+(overpack*KG_TO_LB).toFixed(2)+' LB';
    $('regularKg').textContent=regular.toFixed(3)+' KG / '+(regular*KG_TO_LB).toFixed(2)+' LB';
    $('customKg').textContent=custom.toFixed(3)+' KG / '+(custom*KG_TO_LB).toFixed(2)+' LB';
    $('totalKg').textContent=roundedKg.toLocaleString()+' KG';
    $('totalLb').textContent=roundedLb.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})+' LB';
    if(activeLine===3&&activeMode==='pack'){
      $('bagKg').textContent=bagTargetKg.toFixed(3)+' KG';
      $('bagLb').textContent=bagTargetLb.toFixed(2)+' LB';
      $('chemicalPct').textContent=(chem*100).toFixed(chem===0.012?1:0)+'%';
    }
    return {kgEA,orderEa,calcEa,rate,base,overpack,regular,custom,roundedKg,roundedLb,chem,bagTargetKg,bagTargetLb};
  }
  function resetCalculator(){
    $('calcId').value=''; packSize.value=''; packUnit.value='KS'; pc.value=''; ea.value=''; seedType.value='commercial'; regularSample.value='5'; cropType.value='normalCorn';
    rows.innerHTML=''; noSamples.hidden=false; message.hidden=true; extraEaValue=0; extraEaManuallyAdjusted=false; updatePC(); updateExtraSuggestion(true); clearResults(); packSize.focus();
  }
  function openLine(line){
    activeLine=line;
    show($('linePicker'),false);
    if(line===3){
      $('pageTitle').textContent='Line 3'; $('pageSubtitle').textContent='Choose a calculation mode.'; show($('modePicker'),true); show($('calculator'),false);
    } else { openCalculator(1,'treat'); }
  }
  function openCalculator(line,mode){
    activeLine=line; activeMode=mode; show($('linePicker'),false); show($('modePicker'),false); show($('calculator'),true);
    $('pageTitle').textContent=`Line ${line}`;
    $('pageSubtitle').textContent=mode==='pack'?'Treat & Pack production calculator.':'Treat-only production calculator.';
    $('modeBadge').textContent=mode==='pack'?'Treat & Pack':'Treat Only';
    show($('cropWrap'),line===3&&mode==='pack'); show($('extraEaCard'),line===3&&mode==='pack'); show($('bagTarget'),line===3&&mode==='pack'); show($('chemicalRow'),line===3&&mode==='pack');
    $('backButton').textContent=line===3?'← Line 3 Modes':'← Lines';
    resetCalculator(); calculate();
  }
  function goBack(){
    show($('calculator'),false);
    if(activeLine===3){show($('modePicker'),true);$('pageTitle').textContent='Line 3';$('pageSubtitle').textContent='Choose a calculation mode.';}
    else showLines();
  }
  function showLines(){
    activeLine=null; activeMode=null; show($('calculator'),false); show($('modePicker'),false); show($('linePicker'),true); $('pageTitle').textContent='Select a Line'; $('pageSubtitle').textContent='Choose a production line to begin. Calculations run locally and are not saved.';
  }
  function saveCalculation(){
    const r=calculate(); if(!r || !Number.isFinite(r.roundedKg)) return;
    saveCounter++;
    const id=$('calcId').value.trim()||`Calculation ${saveCounter}`;
    const card=document.createElement('article'); card.className='saved-item';
    const modeText=activeLine===3&&activeMode==='pack'?'Treat & Pack':'Treat Only';
    const bag=activeLine===3&&activeMode==='pack'?`<div><span>Finished Bag Target</span><strong>${r.bagTargetKg.toFixed(3)} KG / ${r.bagTargetLb.toFixed(2)} LB</strong></div>`:'';
    card.innerHTML=`<div class="saved-title"><strong>${escapeHtml(id)}</strong><span>Line ${activeLine} · ${modeText}</span></div><div><span>Pack</span><strong>${escapeHtml(packSize.value)} ${packUnit.value} · ${r.orderEa} EA${r.calcEa!==r.orderEa?` + ${r.calcEa-r.orderEa} Extra`:''}</strong></div><div><span>Seed to Treat</span><strong>${r.roundedKg.toLocaleString()} KG / ${r.roundedLb.toFixed(2)} LB</strong></div>${bag}`;
    $('savedCalculations').appendChild(card); show($('savedSection'),true);
  }
  function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

  document.querySelectorAll('[data-line]').forEach(b=>b.addEventListener('click',()=>openLine(Number(b.dataset.line))));
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>openCalculator(3,b.dataset.mode)));
  $('backToLinesFromMode').addEventListener('click',showLines); $('backButton').addEventListener('click',goBack);
  $('addSample').addEventListener('click',addSample); $('reset').addEventListener('click',resetCalculator);
  [packSize,packUnit,pc,seedType,regularSample,cropType].forEach(x=>x.addEventListener('input',calculate));
  ea.addEventListener('input',()=>{extraEaManuallyAdjusted=false;updateExtraSuggestion(true);calculate();});
  $('extraMinus').addEventListener('click',()=>{extraEaManuallyAdjusted=true;extraEaValue=Math.max(0,extraEaValue-1);updateExtraSuggestion();calculate();});
  $('extraPlus').addEventListener('click',()=>{extraEaManuallyAdjusted=true;extraEaValue+=1;updateExtraSuggestion();calculate();});
  $('saveCalculation').addEventListener('click',saveCalculation);
  $('clearSaved').addEventListener('click',()=>{$('savedCalculations').innerHTML='';show($('savedSection'),false);saveCounter=0;});
  updatePC(); showLines();
})();
