/* ALABQRI — Dhikr Library v2
 * Isolated, accessible, offline-first personal experience.
 * Personal counters are organizational tools, not prescribed devotional numbers.
 */
(function () {
  'use strict';
  var ROOT = 'abq-tasbih-library';
  var KEY = 'abq_tasbih_library_v2';
  var OLD_KEY = 'abq_tasbih_library_v1';
  var groups = [
    ['all','جميع الأذكار'],['tasbih','التسبيح والتهليل'],['istighfar','الاستغفار والتوبة'],
    ['salawat','الصلاة على النبي ﷺ'],['morning','الصباح والمساء'],['after-prayer','أذكار الصلاة'],
    ['quran','الأوراد والأدعية القرآنية'],['sleep','النوم والاستيقاظ'],['prophetic-dua','الأدعية النبوية'],
    ['distress','الكرب والهم'],['family','الأسرة والذرية'],['protection','الاستعاذة والتحصين']
  ];
  var items = [
    {id:'s33',g:'after-prayer',t:'سُبْحَانَ اللهِ',x:'سُبْحَانَ اللهِ',n:33,k:'ذكر مأثور بعد الصلاة',s:'صحيح مسلم، حديث 597',d:'ثلاث وثلاثون تسبيحة ضمن الذكر الوارد بعد الصلاة.'},
    {id:'h33',g:'after-prayer',t:'الْحَمْدُ لِلَّهِ',x:'الْحَمْدُ لِلَّهِ',n:33,k:'ذكر مأثور بعد الصلاة',s:'صحيح مسلم، حديث 597',d:'ثلاث وثلاثون تحميدة ضمن الذكر الوارد بعد الصلاة.'},
    {id:'a33',g:'after-prayer',t:'اللهُ أَكْبَرُ',x:'اللهُ أَكْبَرُ',n:33,k:'ذكر مأثور بعد الصلاة',s:'صحيح مسلم، حديث 597',d:'ثلاث وثلاثون تكبيرة في إحدى صفات الذكر الوارد بعد الصلاة.'},
    {id:'t1',g:'after-prayer',t:'التهليل لإتمام المائة',x:'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',n:1,k:'ذكر مأثور بعد الصلاة',s:'صحيح مسلم، حديث 597',d:'يقال مرة لإتمام الذكر الوارد في هذه الصفة.'},
    {id:'sb100',g:'tasbih',t:'سبحان الله وبحمده',x:'سُبْحَانَ اللهِ وَبِحَمْدِهِ',n:100,k:'وردت مائة مرة في اليوم',s:'صحيح البخاري، حديث 6405؛ صحيح مسلم، حديث 2691',d:'ورد فضل قولها مائة مرة في اليوم.'},
    {id:'tl100',g:'tasbih',t:'تهليل مائة مرة',x:'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',n:100,k:'وردت مائة مرة في اليوم',s:'صحيح البخاري، حديث 3293؛ صحيح مسلم، حديث 2691',d:'ورد هذا الذكر مائة مرة في اليوم.'},
    {id:'hawq',g:'tasbih',t:'الحوقلة',x:'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ',n:0,k:'ذكر مأثور بلا عدد مخصوص هنا',s:'صحيح البخاري، حديث 6384؛ صحيح مسلم، حديث 2704',d:'ورد أنها كنز من كنوز الجنة؛ لا يخصص التطبيق لها عددًا.'},
    {id:'ist3',g:'istighfar',t:'الاستغفار بعد الصلاة',x:'أَسْتَغْفِرُ اللهَ',n:3,k:'ذكر مأثور بعد الصلاة',s:'صحيح مسلم، حديث 591',d:'كان النبي ﷺ إذا انصرف من صلاته استغفر ثلاثًا.'},
    {id:'sayyid',g:'morning',t:'سيد الاستغفار',x:'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',n:1,k:'ذكر مأثور صباحًا ومساءً',s:'صحيح البخاري، حديث 6306',d:'ورد فضله لمن قاله موقنًا به صباحًا ومساءً.'},
    {id:'ist',g:'istighfar',t:'أستغفر الله وأتوب إليه',x:'أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ',n:0,k:'ذكر عام بلا عدد مخصوص',s:'صحيح البخاري، حديث 6307',d:'يكثر المسلم من الاستغفار دون اعتقاد لزوم عدد شرعي مخصوص.'},
    {id:'salat',g:'salawat',t:'الصلاة الإبراهيمية',x:'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ. اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ',n:0,k:'صيغة ثابتة بلا عدد مخصوص هنا',s:'صحيح البخاري، حديث 3370؛ صحيح مسلم، حديث 406',d:'صيغة الصلاة على النبي ﷺ التي علّمها لأصحابه.'},
    {id:'salat2',g:'salawat',t:'الصلاة والسلام على النبي ﷺ',x:'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',n:0,k:'ذكر عام بلا عدد مخصوص',s:'الأحزاب: 56',d:'يكثر المسلم من الصلاة والسلام على النبي ﷺ دون نسبة عدد مخصوص للسنة.'},
    {id:'muaw',g:'morning',t:'سورة الإخلاص والمعوذتان',x:'قُلْ هُوَ اللهُ أَحَدٌ • قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ • قُلْ أَعُوذُ بِرَبِّ النَّاسِ',n:3,k:'مأثور صباحًا ومساءً',s:'سنن أبي داود، حديث 5082؛ جامع الترمذي، حديث 3575',d:'تقرأ السور الثلاث ثلاث مرات صباحًا ومساءً.'},
    {id:'kursi',g:'quran',t:'آية الكرسي كاملة',x:'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',n:0,k:'آية قرآنية كاملة',s:'سورة البقرة، الآية 255',d:'نص الآية كاملًا. يُراجع ضبط الرسم مع المصحف المعتمد قبل الاعتماد النهائي.'},
    {id:'baq',g:'quran',t:'خواتيم سورة البقرة كاملتين',x:'آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِنْ رُسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ • لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِنْ قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنْتَ مَوْلَانَا فَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',n:0,k:'آيتان قرآنيتان كاملتان',s:'سورة البقرة، الآيتان 285–286؛ صحيح البخاري 5009؛ صحيح مسلم 808',d:'أُدرج النص كاملًا بدل العرض المبتور السابق.'},
    {id:'sleep1',g:'sleep',t:'تسبيح عند النوم',x:'سُبْحَانَ اللهِ',n:33,k:'مأثور عند النوم',s:'صحيح البخاري، حديث 5362؛ صحيح مسلم، حديث 2727',d:'ورد مع 33 تحميدة و34 تكبيرة.'},
    {id:'sleep2',g:'sleep',t:'تحميد عند النوم',x:'الْحَمْدُ لِلَّهِ',n:33,k:'مأثور عند النوم',s:'صحيح البخاري، حديث 5362؛ صحيح مسلم، حديث 2727',d:'ورد مع 33 تسبيحة و34 تكبيرة.'},
    {id:'sleep3',g:'sleep',t:'تكبير عند النوم',x:'اللهُ أَكْبَرُ',n:34,k:'مأثور عند النوم',s:'صحيح البخاري، حديث 5362؛ صحيح مسلم، حديث 2727',d:'وردت 34 تكبيرة ضمن الذكر عند النوم.'},
    {id:'dua1',g:'quran',t:'دعاء الهداية والثبات',x:'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً ۚ إِنَّكَ أَنْتَ الْوَهَّابُ',n:0,k:'دعاء قرآني بلا عدد مخصوص',s:'آل عمران: 8',d:'دعاء قرآني للهداية والثبات.'},
    {id:'dua2',g:'quran',t:'دعاء خير الدنيا والآخرة',x:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',n:0,k:'دعاء قرآني بلا عدد مخصوص',s:'البقرة: 201',d:'من جوامع الدعاء القرآني.'},
    {id:'dua3',g:'distress',t:'دعاء ذي النون',x:'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',n:0,k:'دعاء قرآني بلا عدد مخصوص',s:'الأنبياء: 87؛ جامع الترمذي، حديث 3505',d:'دعاء يونس عليه السلام؛ لا يخصص التطبيق له عددًا تعبديًا.'},
    {id:'dua4',g:'quran',t:'دعاء آدم وحواء عليهما السلام',x:'رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',n:0,k:'دعاء قرآني بلا عدد مخصوص',s:'الأعراف: 23',d:'دعاء قرآني في الاعتراف بالتقصير وسؤال المغفرة والرحمة.'},
    {id:'dua5',g:'family',t:'دعاء صلاح الأهل والذرية',x:'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',n:0,k:'دعاء قرآني بلا عدد مخصوص',s:'الفرقان: 74',d:'دعاء لصلاح الأسرة والذرية والقدوة في التقوى.'},
    {id:'dua6',g:'family',t:'دعاء إقامة الصلاة والذرية',x:'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي ۚ رَبَّنَا وَتَقَبَّلْ دُعَاءِ • رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ',n:0,k:'دعاء قرآني بلا عدد مخصوص',s:'إبراهيم: 40–41',d:'دعاء إبراهيم عليه السلام بإقامة الصلاة والمغفرة.'},
    {id:'dua7',g:'distress',t:'دعاء موسى عليه السلام',x:'رَبِّ اشْرَحْ لِي صَدْرِي • وَيَسِّرْ لِي أَمْرِي • وَاحْلُلْ عُقْدَةً مِنْ لِسَانِي • يَفْقَهُوا قَوْلِي',n:0,k:'دعاء قرآني بلا عدد مخصوص',s:'طه: 25–28',d:'دعاء موسى عليه السلام بطلب شرح الصدر وتيسير الأمر.'},
    {id:'dua8',g:'protection',t:'دعاء الاستعاذة من الشيطان',x:'رَبِّ أَعُوذُ بِكَ مِنْ هَمَزَاتِ الشَّيَاطِينِ • وَأَعُوذُ بِكَ رَبِّ أَنْ يَحْضُرُونِ',n:0,k:'دعاء قرآني بلا عدد مخصوص',s:'المؤمنون: 97–98',d:'استعاذة قرآنية من همزات الشياطين وحضورهم.'},
    {id:'dua9',g:'quran',t:'دعاء العلم',x:'رَبِّ زِدْنِي عِلْمًا',n:0,k:'دعاء قرآني بلا عدد مخصوص',s:'طه: 114',d:'دعاء قرآني بطلب الزيادة من العلم.'},
    {id:'dua10',g:'quran',t:'دعاء المغفرة للمؤمنين',x:'رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ وَلَا تَجْعَلْ فِي قُلُوبِنَا غِلًّا لِلَّذِينَ آمَنُوا رَبَّنَا إِنَّكَ رَءُوفٌ رَحِيمٌ',n:0,k:'دعاء قرآني بلا عدد مخصوص',s:'الحشر: 10',d:'دعاء بالمغفرة وسلامة الصدر للمؤمنين.'}
  ];
  var state = {filter:'all',query:'',active:items[0].id,view:'all',counts:{},favorites:[],goals:{}};
  var root, storageAvailable = true;
  function esc(v){return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function load(){
    var raw=null;
    try { raw=localStorage.getItem(KEY); if(!raw) raw=localStorage.getItem(OLD_KEY); }
    catch(e){storageAvailable=false;}
    if(raw){try{var d=JSON.parse(raw);state.counts=d.counts||{};state.favorites=Array.isArray(d.favorites)?d.favorites:[];state.goals=d.goals||{};}catch(e){}}
  }
  function save(){
    try{localStorage.setItem(KEY,JSON.stringify({counts:state.counts,favorites:state.favorites,goals:state.goals,updatedAt:new Date().toISOString()}));storageAvailable=true;}
    catch(e){storageAvailable=false;announce('تعذر الحفظ على هذا الجهاز؛ قد تكون مساحة التخزين أو إعدادات الخصوصية تمنع ذلك.');}
  }
  function announce(msg){var n=root&&root.querySelector('[data-status]');if(n)n.textContent=msg;}
  function current(){return items.find(function(x){return x.id===state.active;})||items[0];}
  function visible(){
    var q=state.query.trim().toLocaleLowerCase();
    return items.filter(function(x){
      var groupOk=state.filter==='all'||x.g===state.filter;
      var viewOk=state.view!=='favorites'||state.favorites.indexOf(x.id)!==-1;
      var textOk=!q||[x.t,x.x,x.k,x.s,x.d].join(' ').toLocaleLowerCase().indexOf(q)!==-1;
      return groupOk&&viewOk&&textOk;
    });
  }
  function render(){
    if(!root)return;
    var chosen=current(), list=visible(), total=Object.keys(state.counts).reduce(function(a,k){return a+(Number(state.counts[k])||0);},0);
    var html='<div class="abq-tl-shell" dir="rtl">';
    html+='<header class="abq-tl-hero"><div><span class="abq-tl-kicker">مجلس العبقري للذكر والتسبيح</span><h3>موسوعة الأذكار والأوراد</h3><p>نصوص مختارة مع مصادرها، وعداد شخصي، وبحث ومفضلة وحفظ محلي.</p></div><div class="abq-tl-summary"><strong>'+total.toLocaleString('ar-EG')+'</strong><span>إجمالي عدّادك على هذا الجهاز</span></div></header>';
    html+='<div class="abq-tl-tools"><label class="abq-tl-search"><span aria-hidden="true">⌕</span><input type="search" data-search placeholder="ابحث باسم الذكر أو نصه أو مصدره..." value="'+esc(state.query)+'" aria-label="البحث في الأذكار"></label><button type="button" data-view="all" class="'+(state.view==='all'?'is-active':'')+'">كل الأذكار</button><button type="button" data-view="favorites" class="'+(state.view==='favorites'?'is-active':'')+'">★ المفضلة ('+state.favorites.length+')</button></div>';
    html+='<nav class="abq-tl-categories" aria-label="تصنيفات الأذكار">';
    groups.forEach(function(g){html+='<button type="button" data-filter="'+g[0]+'" class="'+(state.filter===g[0]?'is-active':'')+'">'+g[1]+'</button>';});
    html+='</nav><div class="abq-tl-workspace"><section class="abq-tl-list-panel" aria-label="قائمة الأذكار"><div class="abq-tl-list-heading"><strong>مكتبة الأذكار</strong><span>'+list.length+' مادة</span></div><div class="abq-tl-list" role="list">';
    list.forEach(function(x){html+='<button type="button" role="listitem" class="abq-tl-item '+(chosen.id===x.id?'is-selected':'')+'" data-item="'+x.id+'"><span><strong>'+esc(x.t)+'</strong><small>'+esc(x.k)+'</small></span><span class="abq-tl-item-mark">'+(state.favorites.indexOf(x.id)!==-1?'★':'›')+'</span></button>';});
    if(!list.length)html+='<p class="abq-tl-empty">لا توجد نتائج مطابقة. جرّب كلمة أخرى أو غيّر التصنيف.</p>';
    html+='</div></section><article class="abq-tl-detail" aria-live="polite">';
    html+='<div class="abq-tl-detail-top"><span>المادة المختارة</span><button type="button" class="abq-tl-fav" data-action="favorite" aria-pressed="'+(state.favorites.indexOf(chosen.id)!==-1)+'">'+(state.favorites.indexOf(chosen.id)!==-1?'★ إزالة من المفضلة':'☆ أضف للمفضلة')+'</button></div>';
    html+='<div class="abq-tl-meta">'+esc(groupName(chosen.g))+'</div><h4>'+esc(chosen.t)+'</h4><p class="abq-tl-dhikr">'+esc(chosen.x)+'</p><p class="abq-tl-note">'+esc(chosen.d)+'</p><div class="abq-tl-source"><b>المصدر والتوثيق:</b> '+esc(chosen.s)+'</div>';
    html+='<div class="abq-tl-counter"><strong>'+Number(state.counts[chosen.id]||0).toLocaleString('ar-EG')+'</strong><span>العدد الذي سجلته لهذا الذكر</span></div>';
    html+='<p class="abq-tl-target">'+(chosen.n?'العدد الوارد في النص: <b>'+chosen.n+'</b> — ':'')+'العداد أداة متابعة شخصية، ولا ينشئ عددًا تعبديًا جديدًا.</p>';
    html+='<div class="abq-tl-actions"><button type="button" data-action="inc" class="primary">＋ أضف مرة</button><button type="button" data-action="reset">تصفير هذا العداد</button><button type="button" data-action="copy">نسخ النص</button></div>';
    if(chosen.n)html+='<div class="abq-tl-progress"><span style="width:'+Math.min(100,(Number(state.counts[chosen.id]||0)/chosen.n)*100)+'%"></span></div>';
    html+='<div class="abq-tl-personal-goal"><label>هدف شخصي اختياري لهذا الذكر <input type="number" min="1" max="100000" data-goal value="'+esc(state.goals[chosen.id]||'')+'" placeholder="أدخل هدفك"></label><small>هدف تنظيمي تختاره بنفسك، وليس عددًا منسوبًا للسنة.</small></div>';
    html+='</article></div><footer class="abq-tl-footer"><span>'+(storageAvailable?'🔒 الحفظ محلي على هذا الجهاز':'⚠️ الحفظ المحلي غير متاح حاليًا')+'</span><span>تُعرض الأعداد المأثورة مع مصادرها، ولا يُخصّص عدد بلا دليل.</span></footer><p class="abq-tl-status" data-status role="status" aria-live="polite"></p></div>';
    root.innerHTML=html;
    bind();
  }
  function groupName(id){var g=groups.find(function(x){return x[0]===id;});return g?g[1]:'أذكار وأدعية';}
  function bind(){
    root.querySelectorAll('[data-filter]').forEach(function(b){b.addEventListener('click',function(){state.filter=b.dataset.filter;state.view='all';render();});});
    root.querySelectorAll('[data-view]').forEach(function(b){b.addEventListener('click',function(){state.view=b.dataset.view;render();});});
    root.querySelectorAll('[data-item]').forEach(function(b){b.addEventListener('click',function(){state.active=b.dataset.item;render();});});
    var search=root.querySelector('[data-search]');if(search)search.addEventListener('input',function(){var pos=this.selectionStart;state.query=this.value;render();var next=root.querySelector('[data-search]');if(next){next.focus();next.setSelectionRange(pos,pos);}});
    var goal=root.querySelector('[data-goal]');if(goal)goal.addEventListener('change',function(){var n=Number(this.value);if(!this.value||!Number.isFinite(n)||n<1){delete state.goals[current().id];}else{state.goals[current().id]=Math.min(100000,Math.floor(n));}save();announce('تم تحديث هدفك الشخصي.');});
    root.querySelectorAll('[data-action]').forEach(function(b){b.addEventListener('click',function(){
      var id=current().id, action=b.dataset.action;
      if(action==='inc'){state.counts[id]=(Number(state.counts[id])||0)+1;save();render();announce('تم تسجيل مرة واحدة.');}
      if(action==='reset'){state.counts[id]=0;save();render();announce('تم تصفير عداد هذا الذكر.');}
      if(action==='favorite'){var i=state.favorites.indexOf(id);if(i<0)state.favorites.push(id);else state.favorites.splice(i,1);save();render();announce('تم تحديث المفضلة.');}
      if(action==='copy'){copyText(current().x).then(function(){announce('تم نسخ النص.');}).catch(function(){announce('تعذر النسخ تلقائيًا؛ يمكنك تحديد النص ونسخه.');});}
    });});
  }
  function copyText(text){
    if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text);
    return new Promise(function(resolve,reject){var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();try{var ok=document.execCommand('copy');document.body.removeChild(t);ok?resolve():reject();}catch(e){document.body.removeChild(t);reject(e);}});
  }
  function init(){root=document.getElementById(ROOT);if(!root)return;load();render();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();