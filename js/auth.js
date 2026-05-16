let selectedUserType = 'child'; // الافتراضي هو طفل

// وظيفة لتغيير نوع المستخدم عند الضغط على الأزرار
function selectType(type) {
    selectedUserType = type;
    
    // تحديث شكل الأزرار
    document.getElementById('childBtn').classList.toggle('active', type === 'child');
    document.getElementById('parentBtn').classList.toggle('active', type === 'parent');
    
    // تغيير النصوص بناءً على النوع
    const label = document.getElementById('nameLabel');
    label.innerText = (type === 'child') ? "Child's Name" : "Parent's Name";
}

// وظيفة معالجة الدخول
function handleLogin(event) {
    event.preventDefault(); // منع الصفحة من إعادة التحميل
    
    const username = document.getElementById('username').value;
    
    // تخزين البيانات في متصفح المستخدم (Local Storage)
    localStorage.setItem('userName', username);
    localStorage.setItem('userType', selectedUserType);
    
    // التوجيه بناءً على النوع
    if (selectedUserType === 'child') {
        window.location.href = 'child_dashboard.html';
    } else {
        window.location.href = 'parent_dashboard.html';
    }
}
// كود مخصص للوحة تحكم الطفل
if (document.getElementById('childName')) {
    // 1. استرجاع اسم الطفل المخزن عند تسجيل الدخول
    const savedName = localStorage.getItem('userName') || "Gezgin";
    document.getElementById('childName').innerText = savedName;

    // 2. إعداد المتغيرات الأولية للتقدم والنقاط
    let currentXP = 0;
    let completedLessonsCount = 0;
    const totalLessons = 4;

    // وظيفة الضغط على زر الدرس لإنهاء المهمة وجمع النقاط
    window.completeLesson = function(lessonId, xpReward) {
        const cardButton = document.querySelector(`#lesson${lessonId} .btn-action`);
        
        // التحقق إذا كان الدرس لم يكتمل بعد
        if (!cardButton.classList.contains('completed')) {
            // تحديث حالة الزر
            cardButton.innerText = "Completed 🎉";
            cardButton.classList.add('completed');
            cardButton.disabled = true;

            // زيادة النقاط (XP) تحديث الواجهة
            currentXP += xpReward;
            document.getElementById('xpCount').innerText = currentXP;
            
            // حفظ النقاط في الـ localStorage ليراها الأب لاحقاً
            localStorage.setItem('childXP', currentXP);

            // تحديث شريط التقدم (Progress Bar)
            completedLessonsCount++;
            const progressPercentage = Math.round((completedLessonsCount / totalLessons) * 100);
            
            document.getElementById('mainProgress').style.width = progressPercentage + '%';
            document.getElementById('progressText').innerText = progressPercentage + '% Completed';
            
            // حفظ نسبة التقدم الكلية
            localStorage.setItem('childProgress', progressPercentage);
        }
    }
}
// كود مخصص لوحة تحكم الأب
if (document.getElementById('parentName')) {
    // 1. استرجاع اسم الأب المخزن عند تسجيل الدخول
    const savedParentName = localStorage.getItem('userName') || "Ebeveyn";
    document.getElementById('parentName').innerText = savedParentName;

    // 2. استرجاع البيانات الديناميكية الخاصة بالطفل من الـ LocalStorage
    // هنا نستخدم اسم افتراضي "Zeynep" إذا لم يقم الطفل بتسجيل الدخول أولاً لتجنب الواجهة الفارغة
    const connectedChildName = localStorage.getItem('userName') ? localStorage.getItem('userName') : "Zeynep 🦊";
    const childXP = localStorage.getItem('childXP') || "0";
    const childProgress = localStorage.getItem('childProgress') || "0";

    // 3. تحديث عناصر الواجهة بالبيانات المسترجعة
    document.getElementById('displayChildName').innerText = connectedChildName;
    document.getElementById('totalFamilyXP').innerText = childXP;
    document.getElementById('displayChildProgress').innerText = childProgress + '%';
    document.getElementById('parentChildProgressFill').style.width = childProgress + '%';

    // وظيفة وهمية لمحاكاة استخراج التقارير الذكية للأبناء
    window.generateReport = function() {
        alert("Fide Report Generator:\n\n" + connectedChildName + " has completed " + childProgress + "% of the financial literacy courses with a total of " + childXP + " XP.\n\nReport downloaded successfully! 📄");
    }
}