- تخصيص النمط البصري، الإضاءة، المحرك، وأبعاد الصورة (--ar).
- **ميزة فحص الاتصال التلقائية:** الإضافة تعمل أوفلاين بالكامل، وفي حال عدم وجود إنترنت يظهر تنبيه لطيف للمصمم بأن النظام يعمل بالقوالب المحلية المخزنة.
### 4. 🧹 أدوات التنظيم والسرعة (Productivity Utilities)
- **حذف الليرات الفارغة (Clean Empty Layers):** فحص المستند وحذف الطبقات الخفية أو الفارغة لتقليل حجم الملف.
- **إعادة تسمية ذكية (Smart Auto-Naming):** ترتيب الليرات حسب نوعها (Text, Shape, Layer).
- **فك القفل الشامل (Unlock All):** فتح كل الطبقات المقفلة في المستند دفعة واحدة.
- **تصدير فوري للويب (Quick PNG Export):** تصدير سريع بدون نوافذ إعدادات معقدة.
---
## 🚀 طريقة التثبيت والتشغيل في أدوبي فوتوشوب (Photoshop UXP)
الإضافة مبنية بمعيار **Adobe UXP (Unified Extensibility Platform)** الحديث والمتوافق مع إصدارات Photoshop 2021 وما بعدها (v22+ و v23+ و v24+ و v25+).
### الطريقة الأولى: التشغيل عبر Adobe UXP Developer Tool (الأسهل والأسرع)
1. حمّل وشغّل برنامج **Adobe UXP Developer Tool (UDT)** (متاح مجاناً من تطبيق Adobe Creative Cloud Desktop).
2. افتح برنامج أدوبي فوتوشوب.
3. في UXP Developer Tool، اضغط على **Add Plugin**.
4. اختر ملف `manifest.json` الموجود داخل هذا المجلد:
   `d:\ملحقاتي الخاصة\CREATIX\شغل انتيجرافيتي\moonberry-photoshop-plugin\manifest.json`
5. اضغط على الزر **Actions** ثم اختر **Load** (أو **Watch**).
6. ستظهر لك لوحة **Moonberry Tool** مباشرة داخل فوتوشوب كـ Panel جانبي!
### الطريقة الثانية: التثبيت كحزمة `.ccx`
- يمكنك من داخل Adobe UXP Developer Tool الضغط على **Package** لإنتاج ملف `moonberry.ccx`، والذي يمكن تثبيته بنقرة مزدوجة (Double Click) على أي جهاز.
---
## 🖥️ المعاينة والتجربة الفورية في المتصفح (Browser Test Mode)
الإضافة مجهزة بمحرك محاكاة ذكي (Mock Simulation Engine). يمكنك فتح ملف `index.html` في أي متصفح ويب مباشرة لمعاينة التصميم وتجربة كافة الميزات وتوليد البرومبتات حتى قبل فتح فوتوشوب!
---
**Crafted with 💜 by [Creatix Studio](https://creatixstudio1.github.io/) for Moonberry Designers**
