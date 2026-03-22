// ── Trends Page ──────────────────────────────────────────────
window.TrendsPage = {
  async render() {
    Navbar.render();
    const app = document.getElementById('app');
    app.innerHTML = `<div class="page">${[1,2].map(() =>
      `<div class="skeleton" style="height:200px;margin-bottom:1rem"></div>`).join('')}</div>`;

    let expenses = [], profile = null;
    try {
      [expenses, profile] = await Promise.all([DataAPI.getExpenses(), DataAPI.getUserProfile()]);
    } catch(e) {
      app.innerHTML = `<div class="page"><div class="empty-state"><i data-lucide="wifi-off"></i><p>${e.message}</p></div></div>`;
      renderIcons(); return;
    }

    if (!expenses.length) {
      app.innerHTML = `<div class="page page-enter">
        <div class="page-title">Trends &amp; Insights</div>
        <div class="empty-state" style="margin-top:4rem">
          <i data-lucide="trending-up"></i><p>No data yet. Add expenses to see trends.</p>
          <button class="btn btn-dark" onclick="ExpenseDrawer.open()"><i data-lucide="plus"></i> Add Expense</button>
        </div></div>`;
      renderIcons(); return;
    }

    const monthlyIncome = parseFloat(profile?.monthly_budget) || 0;
    const insights      = InsightsEngine.insights(expenses, monthlyIncome);
    const catStats      = InsightsEngine.categoryStats(expenses);
    const catSeries     = InsightsEngine.cumulativeByCat(expenses, 30);
    const barColors     = ['#c4d4e8','#c4e0cc','#e8d4b8','#e8c4d4','#d4c4e8','#c4dce8','#e8e0c4'];

    const insightBanners = insights.map((ins, i) => {
      const bgs = ['#f0e8c0','#dce8f0','#dff0e4','#f0dde8','#f0e8c0','#dce8f0'];
      return `<div class="insight-banner insight-animate" style="background:${bgs[i%bgs.length]};--delay:${i*100}ms">
        <span class="insight-icon"><i data-lucide="${ins.icon}"></i></span><span>${ins.text}</span></div>`;
    }).join('');

    const biggest = expenses.reduce((a,b) => Number(a.amount) > Number(b.amount) ? a : b);
    const top     = catStats[0];
    const potSave = Math.round(top.total * 0.2);

    app.innerHTML = `
      <div class="page page-enter">
        <div class="page-title">Trends &amp; Insights</div>
        <div class="page-subtitle">Patterns don't lie. Your wallet doesn't either.</div>
        <div style="margin-bottom:2rem">${insightBanners}</div>
        <div class="grid-2">
          <div class="card">
            <div class="card-heading"><i data-lucide="trending-up"></i> Weekly Spending
              <span style="font-size:0.65rem;opacity:0.4;font-weight:500;text-transform:none;letter-spacing:0">&nbsp;&#183; by week of month</span>
            </div>
            <div id="weekly-line-wrap">${this._weeklyLineChart(expenses, monthlyIncome, barColors)}</div>
          </div>
          <div class="card">
            <div class="card-heading"><i data-lucide="bar-chart-2"></i> Daily Spending
              <span style="font-size:0.65rem;opacity:0.4;font-weight:500;text-transform:none;letter-spacing:0">&nbsp;&#183; last 14 days</span>
            </div>
            <div id="daily-bar-wrap">${this._dailyBarChart(expenses, barColors)}</div>
          </div>
        </div>
        <div class="card" style="margin-top:0">
          <div class="card-heading"><i data-lucide="activity"></i> Spend by Category
            <span style="font-size:0.65rem;opacity:0.4;font-weight:500;text-transform:none;letter-spacing:0">&nbsp;&#183; cumulative 30 days &middot; click legend</span>
          </div>
          <div id="line-chart-wrap">${this._lineChart(catSeries, barColors)}</div>
        </div>
        <div class="grid-3" style="margin-top:1.5rem">
          <div class="card card-blue stat-animate" style="--i:0">
            <div class="card-label"><i data-lucide="zap"></i> Biggest Expense</div>
            <div class="stat-value">&#8377;${Number(biggest.amount).toFixed(0)}</div>
            <div class="stat-note">${biggest.note}</div>
          </div>
          <div class="card card-green stat-animate" style="--i:1">
            <div class="card-label"><i data-lucide="repeat"></i> Top Category</div>
            <div class="stat-value">${top.category}</div>
            <div class="stat-note">&#8377;${top.total.toFixed(0)} total</div>
          </div>
          <div class="card card-orange stat-animate" style="--i:2">
            <div class="card-label"><i data-lucide="piggy-bank"></i> Potential Savings</div>
            <div class="stat-value">&#8377;${potSave.toLocaleString()}</div>
            <div class="stat-note">Cut ${top.category} 20%</div>
          </div>
        </div>
        <div class="card" style="margin-top:1.5rem">
          <div class="card-heading" id="trends-tx-heading"><i data-lucide="clock"></i> All Transactions</div>
          <div class="tx-list" id="trends-tx-list">${this._txRows(expenses, null, barColors)}</div>
        </div>
      </div>`;

    renderIcons();
    this._bindInteractions(expenses, barColors);
  },

  _weeklyLineChart(expenses, monthlyIncome, barColors) {
    const sorted  = [...expenses].sort((a,b) => b.date.localeCompare(a.date));
    const refDate = new Date(sorted[0].date);
    const year    = refDate.getFullYear();
    const month   = refDate.getMonth();
    const weekDefs = [
      { label: 'Week 1', start: 1,  end: 7  },
      { label: 'Week 2', start: 8,  end: 14 },
      { label: 'Week 3', start: 15, end: 21 },
      { label: 'Week 4', start: 22, end: 31 },
    ];
    const weekAmts = weekDefs.map(w => {
      let t = 0;
      expenses.forEach(e => {
        const d = new Date(e.date);
        if (d.getFullYear()===year && d.getMonth()===month) {
          const day = d.getDate();
          if (day >= w.start && day <= w.end) t += Number(e.amount);
        }
      });
      return t;
    });
    const weeklyBudget = monthlyIncome > 0 ? monthlyIncome / 4 : 0;
    const maxVal = Math.max(...weekAmts, weeklyBudget, 1);
    const W=340, H=150, padL=52, padB=28, padT=12, padR=20;
    const cW=W-padL-padR, cH=H-padB-padT, xStep=cW/3;
    const yS = v => cH-(v/maxVal)*cH;
    const grid = [0,0.5,1].map(f => {
      const y=padT+yS(maxVal*f), lbl=maxVal*f>=1000?((maxVal*f)/1000).toFixed(1)+'k':Math.round(maxVal*f);
      return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${padL+cW}" y2="${y.toFixed(1)}" stroke="rgba(26,26,46,0.07)" stroke-width="1"/><text x="${padL-5}" y="${(y+3.5).toFixed(1)}" text-anchor="end" font-family="Space Grotesk,sans-serif" font-size="8" fill="rgba(26,26,46,0.4)">&#8377;${lbl}</text>`;
    }).join('');
    const xLabels = weekDefs.map((w,i) =>
      `<text x="${(padL+i*xStep).toFixed(1)}" y="${H-8}" text-anchor="middle" font-family="Space Grotesk,sans-serif" font-size="8" fill="rgba(26,26,46,0.5)">${w.label}</text>`
    ).join('');
    let refLine = '';
    if (weeklyBudget > 0) {
      const ry=(padT+yS(weeklyBudget)).toFixed(1);
      const lbl=weeklyBudget>=1000?(weeklyBudget/1000).toFixed(1)+'k':Math.round(weeklyBudget);
      refLine=`<line x1="${padL}" y1="${ry}" x2="${padL+cW}" y2="${ry}" stroke="rgba(26,26,46,0.3)" stroke-width="1.5" stroke-dasharray="5,3"/><text x="${(padL+cW+3).toFixed(1)}" y="${(parseFloat(ry)+3).toFixed(1)}" font-family="Space Grotesk,sans-serif" font-size="7" fill="rgba(26,26,46,0.45)">&#8377;${lbl}/wk</text>`;
    }
    const pathD = weekAmts.map((v,i)=>`${i===0?'M':'L'}${(padL+i*xStep).toFixed(1)},${(padT+yS(v)).toFixed(1)}`).join(' ');
    const dots  = weekAmts.map((v,i) => {
      const x=padL+i*xStep, y=padT+yS(v);
      const fill = weeklyBudget>0 && v>weeklyBudget ? '#c0392b' : barColors[0];
      return `<circle class="wl-point" data-week="${weekDefs[i].label}" data-amt="${v.toFixed(2)}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${fill}" stroke="rgba(26,26,46,0.35)" stroke-width="1.5"/>`;
    }).join('');
    const monthName = refDate.toLocaleString('default',{month:'long',year:'numeric'});
    return `<div style="font-size:0.68rem;font-weight:700;opacity:0.4;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:0.5rem">${monthName}</div>
      <svg width="100%" viewBox="0 0 ${W} ${H}" style="display:block;overflow:visible">
        ${grid}
        <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT+cH}" stroke="rgba(26,26,46,0.2)" stroke-width="1"/>
        ${refLine}
        <path d="${pathD}" fill="none" stroke="${barColors[0]}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${dots}${xLabels}
      </svg>
      ${weeklyBudget>0?`<div style="font-size:0.68rem;font-weight:600;opacity:0.4;margin-top:0.4rem;display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:18px;height:0;border-top:1.5px dashed rgba(26,26,46,0.4)"></span>Weekly budget (&#8377;${Math.round(weeklyBudget).toLocaleString()})</div>`:''}`;
  },

  _dailyBarChart(expenses, barColors) {
    const days=14, now=new Date(), dateKeys=[];
    for (let i=days-1;i>=0;i--) { const d=new Date(now); d.setDate(d.getDate()-i); dateKeys.push(d.toISOString().split('T')[0]); }
    const daily={};
    dateKeys.forEach(dk=>{daily[dk]=0;});
    expenses.forEach(e=>{if(daily[e.date]!==undefined) daily[e.date]+=Number(e.amount);});
    const vals=dateKeys.map(dk=>daily[dk]), maxVal=Math.max(...vals,1);
    const W=340,H=150,padL=52,padB=28,padT=12,padR=8;
    const cW=W-padL-padR,cH=H-padB-padT,barW=(cW/days)*0.65,gap=cW/days;
    const grid=[0,0.5,1].map(f=>{
      const y=padT+cH-f*cH, lbl=maxVal*f>=1000?((maxVal*f)/1000).toFixed(1)+'k':Math.round(maxVal*f);
      return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${padL+cW}" y2="${y.toFixed(1)}" stroke="rgba(26,26,46,0.07)" stroke-width="1"/><text x="${(padL-5).toFixed(1)}" y="${(y+3.5).toFixed(1)}" text-anchor="end" font-family="Space Grotesk,sans-serif" font-size="8" fill="rgba(26,26,46,0.4)">&#8377;${lbl}</text>`;
    }).join('');
    const xLabels=dateKeys.map((dk,i)=>{
      if(i%3!==0&&i!==days-1) return '';
      const d=new Date(dk);
      return `<text x="${(padL+i*gap+gap/2).toFixed(1)}" y="${H-8}" text-anchor="middle" font-family="Space Grotesk,sans-serif" font-size="8" fill="rgba(26,26,46,0.4)">${d.getDate()}/${d.getMonth()+1}</text>`;
    }).join('');
    const bars=vals.map((v,i)=>{
      const barH=Math.max((v/maxVal)*cH,v>0?2:0), x=padL+i*gap+(gap-barW)/2, y=padT+cH-barH;
      return `<rect class="daily-bar" data-date="${dateKeys[i]}" data-amt="${v.toFixed(2)}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" fill="${barColors[i%barColors.length]}" stroke="rgba(26,26,46,0.3)" stroke-width="1"/>`;
    }).join('');
    return `<svg width="100%" viewBox="0 0 ${W} ${H}" style="display:block;overflow:visible">
      ${grid}<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT+cH}" stroke="rgba(26,26,46,0.2)" stroke-width="1"/>
      ${bars}${xLabels}</svg>`;
  },

  _lineChart(catSeries, barColors) {
    const { series, dateKeys } = catSeries;
    const days = dateKeys.length;
    if (!series.length) return '<div class="empty-state"><i data-lucide="inbox"></i><p>No data</p></div>';
    const allVals = series.flatMap(s => s.points.map(p => p.value));
    const maxVal  = Math.max(...allVals, 1);
    const W=680,H=160,padL=52,padB=24,padT=8,padR=8;
    const cW=W-padL-padR,cH=H-padB-padT,xStep=cW/(days-1);
    const yS = v => cH-(v/maxVal)*cH;
    const grid=[0,0.33,0.66,1].map(f=>{
      const y=padT+yS(maxVal*f), lbl=maxVal*f>=1000?((maxVal*f)/1000).toFixed(1)+'k':Math.round(maxVal*f);
      return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${padL+cW}" y2="${y.toFixed(1)}" stroke="rgba(26,26,46,0.07)" stroke-width="1"/><text x="${padL-5}" y="${(y+3.5).toFixed(1)}" text-anchor="end" font-family="Space Grotesk,sans-serif" font-size="8" fill="rgba(26,26,46,0.4)">&#8377;${lbl}</text>`;
    }).join('');
    const xIdxs=[0,Math.floor(days/3),Math.floor(2*days/3),days-1];
    const xLabels=xIdxs.map(i=>{
      const d=new Date(dateKeys[i]);
      return `<text x="${(padL+i*xStep).toFixed(1)}" y="${H-6}" text-anchor="middle" font-family="Space Grotesk,sans-serif" font-size="8" fill="rgba(26,26,46,0.4)">${d.getDate()}/${d.getMonth()+1}</text>`;
    }).join('');
    const lines=series.map((s,ci)=>{
      const color=barColors[ci%barColors.length];
      const pathD=s.points.map((p,i)=>`${i===0?'M':'L'}${(padL+i*xStep).toFixed(1)},${(padT+yS(p.value)).toFixed(1)}`).join(' ');
      const dots=s.points.map((p,i)=>{
        if(p.value===0&&(i===0||s.points[i-1].value===0)) return '';
        return `<circle class="line-point" data-cat="${s.category}" data-val="${p.value.toFixed(2)}" data-date="${p.date}" cx="${(padL+i*xStep).toFixed(1)}" cy="${(padT+yS(p.value)).toFixed(1)}" r="3" fill="${color}" stroke="rgba(26,26,46,0.35)" stroke-width="1.5"/>`;
      }).join('');
      return `<g class="line-series" data-cat="${s.category}"><path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}</g>`;
    }).join('');
    const legend=series.map((s,ci)=>`
      <div class="line-legend-item" data-cat="${s.category}">
        <div style="width:18px;height:3px;background:${barColors[ci%barColors.length]};border:1px solid rgba(26,26,46,0.2);flex-shrink:0"></div>
        <span>${s.category}</span>
      </div>`).join('');
    return `<svg width="100%" viewBox="0 0 ${W} ${H}" style="display:block;overflow:visible">
      ${grid}<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT+cH}" stroke="rgba(26,26,46,0.2)" stroke-width="1"/>
      ${xLabels}${lines}</svg>
      <div class="line-legend">${legend}</div>`;
  },

  _txRows(expenses, filterCat, barColors) {
    const list = filterCat ? expenses.filter(e => e.category===filterCat) : expenses;
    if (!list.length) return `<div class="empty-state" style="padding:1.5rem 0"><i data-lucide="inbox"></i><p>No expenses here</p></div>`;
    return list.map((e,i) => `
      <div class="tx-row" style="animation-delay:${i*30}ms">
        <div class="tx-dot" style="background:${barColors[i%barColors.length]}"></div>
        <div class="tx-info"><div class="tx-note">${e.note}</div><div class="tx-meta">${e.category} &middot; ${e.date}</div></div>
        <div class="tx-amount">&#8377;${Number(e.amount).toFixed(2)}</div>
      </div>`).join('');
  },

  _bindInteractions(expenses, barColors) {
    document.querySelectorAll('.wl-point').forEach(dot => {
      dot.addEventListener('mouseenter', e => ChartTooltip.show(e, dot.dataset.week, '&#8377;'+Number(dot.dataset.amt).toFixed(2)));
      dot.addEventListener('mousemove',  e => ChartTooltip.move(e));
      dot.addEventListener('mouseleave', () => ChartTooltip.hide());
    });
    document.querySelectorAll('.daily-bar').forEach(bar => {
      bar.addEventListener('mouseenter', e => {
        const d=new Date(bar.dataset.date);
        ChartTooltip.show(e, d.getDate()+'/'+(d.getMonth()+1), '&#8377;'+Number(bar.dataset.amt).toFixed(2));
      });
      bar.addEventListener('mousemove',  e => ChartTooltip.move(e));
      bar.addEventListener('mouseleave', () => ChartTooltip.hide());
    });
    const txList=document.getElementById('trends-tx-list');
    const txHeading=document.getElementById('trends-tx-heading');
    let activeLineCat=null;
    document.querySelectorAll('.line-point').forEach(dot => {
      dot.addEventListener('mouseenter', e => ChartTooltip.show(e, dot.dataset.cat+'  '+dot.dataset.date, '&#8377;'+dot.dataset.val+' cumulative'));
      dot.addEventListener('mousemove',  e => ChartTooltip.move(e));
      dot.addEventListener('mouseleave', () => ChartTooltip.hide());
    });
    document.querySelectorAll('.line-legend-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        document.querySelectorAll('.line-series').forEach(s => { s.style.opacity = s.dataset.cat===item.dataset.cat?'1':'0.15'; });
      });
      item.addEventListener('mouseleave', () => {
        if (!activeLineCat) document.querySelectorAll('.line-series').forEach(s => { s.style.opacity=''; });
      });
      item.addEventListener('click', () => {
        const cat=item.dataset.cat;
        if (activeLineCat===cat) {
          activeLineCat=null;
          document.querySelectorAll('.line-series').forEach(s=>{s.style.opacity='';});
          document.querySelectorAll('.line-legend-item').forEach(l=>l.classList.remove('selected'));
          if(txList){txList.innerHTML=this._txRows(expenses,null,barColors);renderIcons();}
          if(txHeading){txHeading.innerHTML='<i data-lucide="clock"></i> All Transactions';renderIcons();}
        } else {
          activeLineCat=cat;
          document.querySelectorAll('.line-series').forEach(s=>{s.style.opacity=s.dataset.cat===cat?'1':'0.12';});
          document.querySelectorAll('.line-legend-item').forEach(l=>l.classList.toggle('selected',l.dataset.cat===cat));
          if(txList){txList.innerHTML=this._txRows(expenses,cat,barColors);renderIcons();}
          if(txHeading){txHeading.innerHTML=`<i data-lucide="filter"></i> ${cat} <span style="font-size:0.7rem;opacity:0.4;font-weight:500">&nbsp;&middot; click again to clear</span>`;renderIcons();}
        }
      });
    });
  }
};
