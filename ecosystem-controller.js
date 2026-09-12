/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔄 نظام التحكم والتكامل الموحد لمنظومة العبقري
 * Ecosystem Integration Controller — Alabqari Holistic Balance v2.0
 * 
 * المسؤوليات:
 * ✅ إدارة التنقل بين البوصلة والمصفوفة والمنظومة
 * ✅ إدارة الحالات والبيانات المشتركة
 * ✅ توحيد التفاعلات والتحريكات
 * ✅ ضمان سلاسة الانتقال بين الأداتين
 * ✅ تخزين واسترجاع البيانات
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// I. نظام إدارة الحالة والبيانات (State Management)
// ═══════════════════════════════════════════════════════════════════════════

const EcosystemState = {
  // الأداة النشطة حالياً
  currentTool: 'ecosystem', // 'ecosystem', 'compass', 'matrix'
  
  // بيانات البوصلة
  compassData: {
    status: 'idle', // 'idle', 'in-progress', 'completed'
    answers: [],
    result: null,
    timestamp: null,
  },
  
  // بيانات المصفوفة
  matrixData: {
    status: 'idle',
    answers: [],
    result: null,
    timestamp: null,
  },
  
  // البيانات المشتركة
  userProfile: {
    sessionId: null,
    startTime: null,
    toolsUsed: [],
  },
  
  // إعدادات العرض
  theme: 'light', // 'light', 'dark'
  language: 'ar',
  
  // السجل التاريخي
  history: [],
  
  /**
   * حفظ الحالة في LocalStorage
   */
  save: function() {
    try {
      localStorage.setItem('ecosystemState', JSON.stringify({
        compassData: this.compassData,
        matrixData: this.matrixData,
        userProfile: this.userProfile,
      }));
      console.log('💾 تم حفظ الحالة بنجاح');
    } catch (e) {
      console.error('❌ خطأ في حفظ الحالة:', e);
    }
  },
  
  /**
   * استعادة الحالة من LocalStorage
   */
  load: function() {
    try {
      const saved = localStorage.getItem('ecosystemState');
      if (saved) {
        const data = JSON.parse(saved);
        Object.assign(this, data);
        console.log('✅ تم استعادة الحالة بنجاح');
        return true;
      }
    } catch (e) {
      console.error('❌ خطأ في استعادة الحالة:', e);
    }
    return false;
  },
  
  /**
   * مسح الحالة (إعادة تعيين)
   */
  reset: function() {
    this.compassData = { status: 'idle', answers: [], result: null, timestamp: null };
    this.matrixData = { status: 'idle', answers: [], result: null, timestamp: null };
    this.save();
    console.log('🔄 تم إعادة تعيين الحالة');
  },
};

// ══════════════════════════════════════════════════���════════════════════════
// II. نظام إدارة التنقل (Navigation System)
// ═══════════════════════════════════════════════════════════════════════════

const EcosystemNavigation = {
  /**
   * الانتقال إلى البوصلة
   */
  goToCompass: function() {
    console.log('🧭 الانتقال إلى البوصلة...');
    
    // إخفاء شاشة المنظومة
    const ecosystemScreen = document.getElementById('ecosystem-intro-container');
    if (ecosystemScreen) {
      ecosystemScreen.style.display = 'none';
    }
    
    // إظهار البوصلة
    const compassScreen = document.getElementById('compass-welcome-screen');
    if (compassScreen) {
      compassScreen.style.display = 'block';
      compassScreen.classList.add('ecosystem-transition');
      // تمرير الرسالة تحت الوعي بأن البوصلة قد دخلت
      this.triggerTransition('compass');
    }
    
    // تحديث الحالة
    EcosystemState.currentTool = 'compass';
    EcosystemState.userProfile.toolsUsed.push({
      tool: 'compass',
      enteredAt: new Date().toISOString(),
    });
    EcosystemState.save();
  },
  
  /**
   * الانتقال إلى المصفوفة
   */
  goToMatrix: function() {
    console.log('📊 الانتقال إلى المصفوفة...');
    
    // إخفاء شاشة المنظومة
    const ecosystemScreen = document.getElementById('ecosystem-intro-container');
    if (ecosystemScreen) {
      ecosystemScreen.style.display = 'none';
    }
    
    // إظهار المصفوفة
    const matrixScreen = document.getElementById('matrix-welcome-screen');
    if (matrixScreen) {
      matrixScreen.style.display = 'block';
      matrixScreen.classList.add('ecosystem-transition');
      // تمرير الرسالة تحت الوعي بأن المصفوفة قد دخلت
      this.triggerTransition('matrix');
    }
    
    // تحديث الحالة
    EcosystemState.currentTool = 'matrix';
    EcosystemState.userProfile.toolsUsed.push({
      tool: 'matrix',
      enteredAt: new Date().toISOString(),
    });
    EcosystemState.save();
  },
  
  /**
   * العودة إلى المنظومة
   */
  backToEcosystem: function() {
    console.log('🌍 العودة إلى المنظومة...');
    
    // إخفاء الأداتين
    const compassScreen = document.getElementById('compass-welcome-screen');
    const matrixScreen = document.getElementById('matrix-welcome-screen');
    
    if (compassScreen) compassScreen.style.display = 'none';
    if (matrixScreen) matrixScreen.style.display = 'none';
    
    // إظهار المنظومة
    const ecosystemScreen = document.getElementById('ecosystem-intro-container');
    if (ecosystemScreen) {
      ecosystemScreen.style.display = 'block';
      ecosystemScreen.classList.add('ecosystem-transition');
    }
    
    // تحديث الحالة
    EcosystemState.currentTool = 'ecosystem';
    EcosystemState.save();
  },
  
  /**
   * تفعيل تحريك الانتقال
   */
  triggerTransition: function(tool) {
    // إرسال حدث مخصص
    const event = new CustomEvent('ecosystemTransition', {
      detail: { tool: tool, timestamp: new Date().toISOString() }
    });
    document.dispatchEvent(event);
    
    // تسجيل في السجل
    EcosystemState.history.push({
      action: 'transition',
      from: EcosystemState.currentTool,
      to: tool,
      timestamp: new Date().toISOString(),
    });
  },
  
  /**
   * تبديل بين الأداتين مباشرة
   */
  switchTool: function(targetTool) {
    if (targetTool === 'compass') {
      this.goToCompass();
    } else if (targetTool === 'matrix') {
      this.goToMatrix();
    } else if (targetTool === 'ecosystem') {
      this.backToEcosystem();
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// III. نظام إدارة البيانات المشتركة (Data Sharing System)
// ═══════════════════════════════════════════════════════════════════════════

const EcosystemDataManager = {
  /**
   * حفظ إجابات البوصلة
   */
  saveCompassAnswers: function(answers) {
    EcosystemState.compassData.answers = answers;
    EcosystemState.compassData.status = 'in-progress';
    EcosystemState.save();
    console.log('💾 تم حفظ إجابات البوصلة:', answers.length);
  },
  
  /**
   * حفظ نتيجة البوصلة
   */
  saveCompassResult: function(result) {
    EcosystemState.compassData.result = result;
    EcosystemState.compassData.status = 'completed';
    EcosystemState.compassData.timestamp = new Date().toISOString();
    EcosystemState.save();
    console.log('✅ تم حفظ ��تيجة البوصلة');
    this.notifyCompletion('compass', result);
  },
  
  /**
   * حفظ إجابات المصفوفة
   */
  saveMatrixAnswers: function(answers) {
    EcosystemState.matrixData.answers = answers;
    EcosystemState.matrixData.status = 'in-progress';
    EcosystemState.save();
    console.log('💾 تم حفظ إجابات المصفوفة:', answers.length);
  },
  
  /**
   * حفظ نتيجة المصفوفة
   */
  saveMatrixResult: function(result) {
    EcosystemState.matrixData.result = result;
    EcosystemState.matrixData.status = 'completed';
    EcosystemState.matrixData.timestamp = new Date().toISOString();
    EcosystemState.save();
    console.log('✅ تم حفظ نتيجة المصفوفة');
    this.notifyCompletion('matrix', result);
  },
  
  /**
   * الحصول على بيانات البوصلة
   */
  getCompassData: function() {
    return EcosystemState.compassData;
  },
  
  /**
   * الحصول على بيانات المصفوفة
   */
  getMatrixData: function() {
    return EcosystemState.matrixData;
  },
  
  /**
   * الحصول على كلا النتيجتين معاً
   */
  getCombinedResults: function() {
    return {
      compass: EcosystemState.compassData.result,
      matrix: EcosystemState.matrixData.result,
      generatedAt: new Date().toISOString(),
    };
  },
  
  /**
   * إخطار بإكمال أداة
   */
  notifyCompletion: function(tool, result) {
    const event = new CustomEvent('toolCompleted', {
      detail: {
        tool: tool,
        result: result,
        timestamp: new Date().toISOString(),
      }
    });
    document.dispatchEvent(event);
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// IV. نظام التحريكات والانتقالات الموحدة (Unified Animations)
// ═══════════════════════════════════════════════════════════════════════════

const EcosystemAnimations = {
  /**
   * تحريك الدخول (Fade In)
   */
  fadeIn: function(element, duration = 400) {
    if (!element) return;
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    
    setTimeout(() => {
      element.style.opacity = '1';
    }, 10);
  },
  
  /**
   * تحريك الخروج (Fade Out)
   */
  fadeOut: function(element, duration = 400) {
    if (!element) return;
    element.style.opacity = '1';
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    element.style.opacity = '0';
  },
  
  /**
   * تحريك الانزلاق (Slide)
   */
  slideIn: function(element, direction = 'up', duration = 500) {
    if (!element) return;
    
    let transform = 'translateY(20px)';
    if (direction === 'down') transform = 'translateY(-20px)';
    if (direction === 'left') transform = 'translateX(20px)';
    if (direction === 'right') transform = 'translateX(-20px)';
    
    element.style.opacity = '0';
    element.style.transform = transform;
    element.style.transition = `all ${duration}ms ease-out`;
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translate(0, 0)';
    }, 10);
  },
  
  /**
   * تحريك الظهور التدريجي (Scale Up)
   */
  scaleIn: function(element, duration = 400) {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'scale(0.95)';
    element.style.transition = `all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
    }, 10);
  },
  
  /**
   * تحريك الاهتزاز (Shake)
   */
  shake: function(element, duration = 500) {
    if (!element) return;
    
    const keyframes = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
    `;
    
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);
    
    element.style.animation = `shake ${duration}ms`;
    
    setTimeout(() => {
      element.style.animation = 'none';
    }, duration);
  },
  
  /**
   * تحريك النبض (Pulse)
   */
  pulse: function(element, duration = 1000, times = 3) {
    if (!element) return;
    
    let count = 0;
    const interval = setInterval(() => {
      element.style.transform = count % 2 === 0 ? 'scale(1.05)' : 'scale(1)';
      element.style.transition = `transform ${duration / (times * 2)}ms ease-in-out`;
      count++;
      
      if (count >= times * 2) {
        clearInterval(interval);
        element.style.transform = 'scale(1)';
      }
    }, duration / (times * 2));
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// V. نظام إدارة الأحداث (Event System)
// ═══════════════════════════════════════════════════════════════════════════

const EcosystemEvents = {
  /**
   * الاستماع لأحداث الانتقال
   */
  onTransition: function(callback) {
    document.addEventListener('ecosystemTransition', callback);
  },
  
  /**
   * الاستماع لأحداث إكمال الأداة
   */
  onToolCompleted: function(callback) {
    document.addEventListener('toolCompleted', callback);
  },
  
  /**
   * الاستماع لأحداث تغيير البيانات
   */
  onDataChanged: function(callback) {
    document.addEventListener('ecosystemDataChanged', callback);
  },
  
  /**
   * إطلاق حدث تغيير البيانات
   */
  emitDataChanged: function(tool, data) {
    const event = new CustomEvent('ecosystemDataChanged', {
      detail: { tool, data, timestamp: new Date().toISOString() }
    });
    document.dispatchEvent(event);
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// VI. نظام المساعدات والأدوات (Utilities)
// ═══════════════════════════════════════════════════════════════════════════

const EcosystemUtils = {
  /**
   * توليد معرّف جلسة فريد
   */
  generateSessionId: function() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },
  
  /**
   * تنسيق التاريخ والوقت
   */
  formatTimestamp: function(timestamp, locale = 'ar-SA') {
    const date = new Date(timestamp);
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  },
  
  /**
   * حساب المدة الزمنية بين نقطتين
   */
  calculateDuration: function(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.floor((end - start) / 1000); // بالثواني
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    return { hours, minutes, seconds, total: duration };
  },
  
  /**
   * طباعة تقرير الجلسة
   */
  generateSessionReport: function() {
    const report = {
      sessionId: EcosystemState.userProfile.sessionId,
      startTime: EcosystemState.userProfile.startTime,
      endTime: new Date().toISOString(),
      toolsUsed: EcosystemState.userProfile.toolsUsed,
      compassStatus: EcosystemState.compassData.status,
      matrixStatus: EcosystemState.matrixData.status,
      historyCount: EcosystemState.history.length,
    };
    
    return report;
  },
  
  /**
   * تصدير البيانات كـ JSON
   */
  exportData: function(filename = 'alabqri-ecosystem-export.json') {
    const data = {
      exportDate: new Date().toISOString(),
      state: {
        compassData: EcosystemState.compassData,
        matrixData: EcosystemState.matrixData,
        userProfile: EcosystemState.userProfile,
        history: EcosystemState.history,
      }
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log('📥 تم تصدير البيانات');
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// VII. التهيئة والإعداد (Initialization)
// ═══════════════════════════════════════════════════════════════════════════

const EcosystemInit = {
  /**
   * تهيئة النظام
   */
  init: function() {
    console.log('🚀 تهيئة نظام العبقري للاتزان الشامل...');
    
    // استعادة الحالة المحفوظة
    EcosystemState.load();
    
    // إنشاء معرف جلسة إذا لم يكن موجوداً
    if (!EcosystemState.userProfile.sessionId) {
      EcosystemState.userProfile.sessionId = EcosystemUtils.generateSessionId();
      EcosystemState.userProfile.startTime = new Date().toISOString();
    }
    
    // إعداد المستمعين
    this.setupEventListeners();
    
    // إظهار رسالة الترحيب
    this.showWelcomeMessage();
    
    console.log('✅ تم تهيئة النظام بنجاح');
    console.log('🆔 معرف الجلسة:', EcosystemState.userProfile.sessionId);
  },
  
  /**
   * إعداد المستمعين
   */
  setupEventListeners: function() {
    // الاستماع للانتقالات
    EcosystemEvents.onTransition((event) => {
      console.log('📍 انتقال:', event.detail);
    });
    
    // الاستماع لإكمال الأداوات
    EcosystemEvents.onToolCompleted((event) => {
      console.log('🏆 اكتملت أداة:', event.detail.tool);
    });
    
    // الاستماع لتغيير البيانات
    EcosystemEvents.onDataChanged((event) => {
      console.log('📊 تغيرت البيانات:', event.detail);
    });
  },
  
  /**
   * إظهار رسالة الترحيب
   */
  showWelcomeMessage: function() {
    console.log(`
    ╔════════════════════════════════════════════════════════════╗
    ║  🌍 مرحباً بك في منظومة العبقري للاتزان الشامل 🌍          ║
    ║                                                              ║
    ║  🧭 البوصلة: اكتشف اتجاهك وحدد نقاط قوتك                 ║
    ║  📊 المصفوفة: افهم منظومتك بعمق                            ║
    ║                                                              ║
    ║  النقل الانسيابي بين الأداتين يضمن رحلة موحدة            ║
    ╚════════════════════════════════════════════════════════════╝
    `);
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// VIII. واجهات برمجية عامة (Public API)
// ═══════════════════════════════════════════════════════════════════════════

window.Ecosystem = {
  // التنقل
  goToCompass: () => EcosystemNavigation.goToCompass(),
  goToMatrix: () => EcosystemNavigation.goToMatrix(),
  backToEcosystem: () => EcosystemNavigation.backToEcosystem(),
  switchTool: (tool) => EcosystemNavigation.switchTool(tool),
  
  // البيانات
  saveCompassResult: (result) => EcosystemDataManager.saveCompassResult(result),
  saveMatrixResult: (result) => EcosystemDataManager.saveMatrixResult(result),
  getResults: () => EcosystemDataManager.getCombinedResults(),
  
  // التحريكات
  fadeIn: (el, duration) => EcosystemAnimations.fadeIn(el, duration),
  fadeOut: (el, duration) => EcosystemAnimations.fadeOut(el, duration),
  slideIn: (el, direction, duration) => EcosystemAnimations.slideIn(el, direction, duration),
  scaleIn: (el, duration) => EcosystemAnimations.scaleIn(el, duration),
  
  // الأحداث
  on: (event, callback) => {
    if (event === 'transition') EcosystemEvents.onTransition(callback);
    else if (event === 'completed') EcosystemEvents.onToolCompleted(callback);
    else if (event === 'dataChanged') EcosystemEvents.onDataChanged(callback);
  },
  
  // المساعدات
  getState: () => EcosystemState,
  exportData: (filename) => EcosystemUtils.exportData(filename),
  reset: () => EcosystemState.reset(),
};

// ═══════════════════════════════════════════════════════════════════════════
// IX. بدء التطبيق
// ═══════════════════════════════════════════════════════════════════════════

// تهيئة النظام عند تحميل الصفحة
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    EcosystemInit.init();
  });
} else {
  EcosystemInit.init();
}

// ═══════════════════════════════════════════════════════════════════════════
// نهاية نظام التحكم والتكامل
// ═══════════════════════════════════════════════════════════════════════════
