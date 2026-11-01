/* ALABQRI Tasbih & Dhikr Library — isolated enhancement */
(function () {
'use strict';
var ROOT='abq-tasbih-library', KEY='abq_tasbih_library_v1';
var items=[
{id:'s33',g:'tasbih',t:'سُبْحَانَ اللهِ',x:'سُبْحَانَ اللهِ',n:33,k:'مأثور بعد الصلاة',s:'صحيح مسلم، حديث 597',d:'ثلاث وثلاثون تسبيحة ضمن الذكر الوارد بعد الصلاة.'},
{id:'h33',g:'tasbih',t:'الْحَمْدُ لِلَّهِ',x:'الْحَمْدُ لِلَّهِ',n:33,k:'مأثور بعد الصلاة',s:'صحيح مسلم، حديث 597',d:'ثلاث وثلاثون تحميدة ضمن الذكر الوارد بعد الصلاة.'},
{id:'a33',g:'tasbih',t:'اللهُ أَكْبَرُ',x:'اللهُ أَكْبَرُ',n:33,k:'مأثور بعد الصلاة',s:'صحيح مسلم، حديث 597',d:'ثلاث وثلاثون تكبيرة، ثم يأتي التهليل لإتمام المائة.'},
{id:'t1',g:'tasbih',t:'التهليل لإتمام المائة',x:'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',n:1,k:'مأثور بعد الصلاة',s:'صحيح مسلم، حديث 597',d:'يقال مرة لإتمام الذكر الوارد بعد الصلاة.'},
{id:'sb100',g:'tasbih',t:'سبحان الله وبحمده',x:'سُبْحَانَ اللهِ وَبِحَمْدِهِ',n:100,k:'مأثور — مائة مرة يوميًا',s:'صحيح البخاري، حديث 6405؛ صحيح مسلم، حديث 2691',d:'ورد فضل قولها مائة مرة في اليوم.'},
{id:'tl100',g:'tasbih',t:'تهليل مائة مرة',x:'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',n:100,k:'مأثور — مائة مرة',s:'صحيح البخاري، حديث 3293؛ صحيح مسلم، حديث 2691',d:'ورد هذا الذكر مائة مرة في اليوم.'},
{id:'ist3',g:'istighfar',t:'الاستغفار بعد الصلاة',x:'أَسْتَغْفِرُ اللهَ',n:3,k:'مأثور بعد الصلاة',s:'صحيح مسلم، حديث 591',d:'كان النبي ﷺ إذا انصرف من صلاته استغفر ثلاثًا.'},
{id:'sayyid',g:'istighfar',t:'سيد الاستغفار',x:'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',n:1,k:'مأثور صباحًا ومساءً',s:'صحيح البخاري، حديث 6306',d:'ورد فضله لمن قاله موقنًا به صباحًا ومساءً.'},
{id:'ist',g:'istighfar',t:'أستغفر الله وأتوب إليه',x:'أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ',n:0,k:'ذكر عام — بلا عدد مخصوص',s:'صحيح البخاري، حديث 6307',d:'يكرر دون اعتقاد لزوم عدد شرعي مخصوص.'},
{id:'hawq',g:'tasbih',t:'الحوقلة',x:'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ',n:0,k:'ذكر مأثور — بلا عدد مخصوص',s:'صحيح البخاري، حديث 6384؛ صحيح مسلم، حديث 2704',d:'ورد أنها كنز من كنوز الجنة؛ لا يخصص التطبيق لها عددًا.'},
{id:'salat',g:'salawat',t:'الصلاة الإبراهيمية',x:'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ. اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ',n:0,k:'صيغة ثابتة — بلا عدد مخصوص هنا',s:'صحيح البخاري، حديث 3370؛ صحيح مسلم، حديث 406',d:'صيغة الصلاة على النبي ﷺ التي علّمها لأصحابه.'},
{id:'salat2',g:'salawat',t:'الصلاة والسلام على النبي ﷺ',x:'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',n:0,k:'ذكر عام — بلا عدد مخصوص',s:'الأحزاب: 56',d:'يكثر المسلم من الصلاة والسلام على النبي ﷺ دون نسبة عدد مخصوص للسنة.'},
{id:'muaw',g:'morning',t:'الإخلاص والمعوذتان',x:'قُلْ هُوَ اللهُ أَحَدٌ • قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ • قُلْ أَعُوذُ بِرَبِّ النَّاسِ',n:3,k:'مأثور صباحًا ومساءً',s:'سنن أبي داود، حديث 5082؛ جامع الترمذي، حديث 3575',d:'تقرأ السور الثلاث ثلاث مرات صباحًا ومساءً.'},
{id:'kursi',g:'quran',t:'آية الكرسي',x:'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ...',n:0,k:'قرآن كريم — البقرة: 255',s:'سورة البقرة، الآية 255',d:'النص المختصر هنا للتعريف؛ تُقرأ الآية كاملة من المصحف.'},
{id:'baq',g:'quran',t:'خواتيم سورة البقرة',x:'آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالْمُؤْمِنُونَ ...',n:0,k:'قرآن كريم — البقرة: 285–286',s:'سورة البقرة، الآيتان 285–286؛ البخاري 5009؛ مسلم 808',d:'النص المختصر هنا للتعريف؛ تُقرأ الآيتان كاملتين من المصحف.'},
{id:'sleep1',g:'sleep',t:'تسبيح عند النوم',x:'سُبْحَانَ اللهِ',n:33,k:'مأثور عند النوم',s:'صحيح البخاري، حديث 5362؛ صحيح مسلم، حديث 2727',d:'ورد مع 33 تحميدة و34 تكبيرة.'},
{id:'sleep2',g:'sleep',t:'تحميد عند النوم',x:'الْحَمْدُ لِلَّهِ',n:33,k:'مأثور عند النوم',s:'صحيح البخاري، حديث 5362؛ صحيح مسلم، حديث 2727',d:'ورد مع 33 تسبيحة و34 تكبيرة.'},
{id:'sleep3',g:'sleep',t:'تكبير عند النوم',x:'اللهُ أَكْبَرُ',n:34,k:'مأثور عند النوم',s:'صحيح البخاري، حديث 5362؛ صحيح مسلم، حديث 2727',d:'وردت 34 تكبيرة ضمن الذكر عند النوم.'},
{id:'dua1',g:'dua',t:'دعاء الهداية والثبات',x:'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً ۚ إِنَّكَ أَنْتَ الْوَهَّابُ',n:0,k:'دعاء قرآني — بلا عدد مخصوص',s:'آل عمران: 8',d:'دعاء قرآني للهداية والثبات.'},
{id:'dua2',g:'dua',t:'دعاء خير الدنيا والآخرة',x:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',n:0,k:'دعاء قرآني — بلا عدد مخصوص',s:'البقرة: 201',d:'من جوامع الدعاء القرآني.'},
{id:'dua3',g:'dua',t:'دعاء ذي النون',x:'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',n:0,k:'دعاء قرآني — بلا عدد مخصوص',s:'الأنبياء: 87؛ جامع الترمذي، حديث 3505',d:'دعاء يونس عليه السلام؛ لا يخصص التطبيق له عددًا تعبديًا.'}
];
var groups=[['all','الكل'],['tasbih','التسبيح والتهليل'],['istighfar','الاستغفار والتوبة'],['salawat','الصلاة على النبي ﷺ'],['morning','الصباح والمساء'],['quran','الأوراد القرآنية'],['sleep','أذكار النوم'],['dua','جوامع الدعاء']];
var filter='all',active=items[0].id,count=0;
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function saved(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
function persist(){var d=saved();d.counts=d.counts||{};d.counts[active]=count;localStorage.setItem(KEY,JSON.stringify(d))}
function render(){
 var root=document.getElementById(ROOT);if(!root)return;
 var chosen=items.filter(function(x){return x.id===active})[0];
 var list=items.filter(function(x){return filter==='all'||x.g===filter});
 var html='<div class="abq-tl-shell" dir="rtl"><div class="abq-tl-intro"><span class="abq-tl-kicker">موسوعة العبقري للذكر</span><h3>🌿 اختر ذِكرَك وابدأ وِردَك</h3><p>أذكار مأثورة وأدعية قرآنية مع بيان المصدر والعدد حيث ثبت.</p></div><div class="abq-tl-filter">';
 groups.forEach(function(g){html+='<button type="button" data-filter="'+g[0]+'" class="'+(filter===g[0]?'is-active':'')+'">'+g[1]+'</button>'});
 html+='</div><div class="abq-tl-grid"><div class="abq-tl-list">';
 list.forEach(function(x){html+='<button type="button" class="abq-tl-item '+(active===x.id?'is-selected':'')+'" data-item="'+x.id+'"><strong>'+esc(x.t)+'</strong><small>'+esc(x.k)+'</small></button>'});
 html+='</div><article class="abq-tl-detail">';
 if(chosen){html+='<div class="abq-tl-detail-head"><span>الورد المختار</span><span class="abq-tl-kind">'+esc(chosen.k)+'</span></div><h4>'+esc(chosen.t)+'</h4><p class="abq-tl-dhikr">'+esc(chosen.x)+'</p><p class="abq-tl-note">'+esc(chosen.d)+'</p><div class="abq-tl-source"><b>المصدر:</b> '+esc(chosen.s)+'</div><div class="abq-tl-counter"><strong id="abq-tl-count">'+count+'</strong><span>التكرار الحالي</span></div><p class="abq-tl-target">'+(chosen.n?'العدد الوارد: <b>'+chosen.n+'</b>':'لا يوجد عدد مخصوص محدد في هذا العرض.')+'</p><div class="abq-tl-actions"><button type="button" data-action="inc">＋ تسبيحة</button><button type="button" data-action="reset">إعادة العداد</button><button type="button" data-action="copy">نسخ الذكر</button></div><div class="abq-tl-progress"><span style="width:'+(chosen.n?Math.min(100,count/chosen.n*100):0)+'%"></span></div>'}
 else{html+='<div class="abq-tl-empty">اختر ذكرًا من القائمة</div>'}
 html+='</article></div><div class="abq-tl-foot"><span>🔒 يُحفظ تقدمك على هذا الجهاز فقط.</span><span>الأعداد التنظيمية لا تُنسب للسنة إلا بدليل.</span></div></div>';
 root.innerHTML=html;
 root.querySelectorAll('[data-filter]').forEach(function(b){b.addEventListener('click',function(){filter=b.dataset.filter;render()})});
 root.querySelectorAll('[data-item]').forEach(function(b){b.addEventListener('click',function(){active=b.dataset.item;var d=saved();count=d.counts&&d.counts[active]||0;render()})});
 root.querySelectorAll('[data-action]').forEach(function(b){b.addEventListener('click',function(){var action=b.dataset.action;if(action==='inc'){count++;persist();var n=root.querySelector('#abq-tl-count');if(n)n.textContent=count;var p=root.querySelector('.abq-tl-progress span');if(p&&chosen.n)p.style.width=Math.min(100,count/chosen.n*100)+'%'}else if(action==='reset'){count=0;persist();render()}else if(action==='copy'&&navigator.clipboard){navigator.clipboard.writeText(chosen.x).then(function(){b.textContent='تم النسخ ✓'}).catch(function(){})}})});
}
function init(){if(!document.getElementById(ROOT))return;var d=saved();count=d.counts&&d.counts[active]||0;render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();