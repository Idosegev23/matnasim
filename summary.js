// טעינת נתונים מה-localStorage
function loadAllCentersData() {
    const centers = [];
    // עבור על כל הנתונים ב-localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // חיפוש נתוני מרכז לפי המפתח
        if (key.includes('personalDetails')) {
            const centerData = JSON.parse(localStorage.getItem(key));
            centers.push({
                id: key.replace('personalDetails_', ''),
                ...centerData,
                questionnaires: loadCenterQuestionnaires(key.replace('personalDetails_', ''))
            });
        }
    }
    return centers;
}

// טעינת נתוני השאלונים עבור מרכז ספציפי
function loadCenterQuestionnaires(centerId) {
    const questionnaires = {};
    const types = ['inventory', 'youth', 'registration', 'legal', 'financial', 'hr', 'budget', 'accounting'];
    
    types.forEach(type => {
        const key = `${type}Form_answers_${centerId}`;
        const data = localStorage.getItem(key);
        if (data) {
            questionnaires[type] = JSON.parse(data);
        }
    });
    
    return questionnaires;
}

// יצירת כרטיסיות המרכזים
function createCenterCards(centers) {
    const grid = document.getElementById('centersGrid');
    grid.innerHTML = '';
    
    centers.forEach(center => {
        const card = document.createElement('div');
        card.className = 'center-card';
        card.innerHTML = `
            <h3>${center.centerName}</h3>
            <p><i class="fas fa-user"></i> ${center.managerName}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${center.city}</p>
            <div class="questionnaires-status">
                ${createStatusIndicators(center.questionnaires)}
            </div>
        `;
        
        card.addEventListener('click', () => showCenterDetails(center));
        grid.appendChild(card);
    });
}

// יצירת אינדיקטורים לסטטוס השאלונים
function createStatusIndicators(questionnaires) {
    const types = {
        inventory: 'מלאי',
        youth: 'ילדים ונוער',
        registration: 'אישורים',
        legal: 'משפטי',
        financial: 'כספי',
        hr: 'כוח אדם',
        budget: 'תקציב',
        accounting: 'הנהח"ש'
    };
    
    return Object.entries(types).map(([key, label]) => {
        const status = questionnaires[key] ? 'completed' : 'pending';
        return `
            <div class="status-indicator ${status}">
                <span class="status-label">${label}</span>
            </div>
        `;
    }).join('');
}

// הצגת פרטי המרכז במודל
function showCenterDetails(center) {
    const modal = document.getElementById('centerModal');
    document.getElementById('modalCenterName').textContent = center.centerName;
    document.getElementById('modalManagerName').textContent = `מנהל/ת: ${center.managerName}`;
    document.getElementById('modalCity').textContent = `עיר: ${center.city}`;
    document.getElementById('modalPhone').textContent = `טלפון: ${center.phone}`;
    document.getElementById('modalEmail').textContent = `דוא"ל: ${center.email}`;
    
    // הצגת השאלון הראשון
    showQuestionnaireContent('inventory', center.questionnaires.inventory);
    
    modal.style.display = 'block';
}

// הצגת תוכן השאלון
function showQuestionnaireContent(type, answers) {
    const content = document.getElementById('summaryContent');
    if (!answers) {
        content.innerHTML = '<p class="no-data">לא נמצאו נתונים עבור שאלון זה</p>';
        return;
    }
    
    // מיפוי שמות השאלונים
    const questionnaireNames = {
        inventory: 'ניהול מלאי',
        youth: 'תכניות ילדים ונוער',
        registration: 'אישורים ותעודות',
        legal: 'משפטי',
        financial: 'ניהול כספי',
        hr: 'כוח אדם',
        budget: 'תקציב',
        accounting: 'הנהלת חשבונות'
    };
    
    let html = `<h3>${questionnaireNames[type]}</h3><div class="answers-list">`;
    
    // עיבוד התשובות
    Object.keys(answers).forEach(key => {
        if (!key.endsWith('_text')) {
            const answer = answers[key];
            const explanation = answers[`${key}_text`];
            
            html += `
                <div class="answer-item ${answer === 'no' ? 'negative' : ''}">
                    <div class="answer-header">
                        <span class="answer-icon">
                            <i class="fas fa-${answer === 'yes' ? 'check' : 'times'}"></i>
                        </span>
                        <span class="question-number">${key.replace('q', 'שאלה ')}</span>
                    </div>
                    ${explanation ? `
                        <div class="answer-explanation">
                            <strong>הסבר:</strong>
                            <p>${explanation}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    });
    
    html += '</div>';
    content.innerHTML = html;
}

// אירועי לחיצה על הטאבים
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', (e) => {
        const type = e.target.dataset.tab;
        const center = getCurrentCenterData(); // פונקציה שצריך להוסיף
        
        // הסרת הקלאס active מכל הכפתורים
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // הוספת הקלאס active לכפתור הנוכחי
        e.target.classList.add('active');
        
        // הצגת התוכן המתאים
        showQuestionnaireContent(type, center.questionnaires[type]);
    });
});

// סגירת המודל
document.querySelector('.close-button').addEventListener('click', () => {
    document.getElementById('centerModal').style.display = 'none';
});

// חיפוש וסינון
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const cityFilter = document.getElementById('cityFilter').value.toLowerCase();
    
    const centers = loadAllCentersData();
    const filteredCenters = centers.filter(center => {
        const matchesSearch = center.centerName.toLowerCase().includes(searchTerm) ||
                            center.managerName.toLowerCase().includes(searchTerm);
        const matchesCity = !cityFilter || center.city.toLowerCase() === cityFilter;
        return matchesSearch && matchesCity;
    });
    
    createCenterCards(filteredCenters);
});

// עדכון רשימת הערים בפילטר
function updateCityFilter() {
    const centers = loadAllCentersData();
    const cities = [...new Set(centers.map(center => center.city))].sort();
    
    const cityFilter = document.getElementById('cityFilter');
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        cityFilter.appendChild(option);
    });
}

// טעינה ראשונית
document.addEventListener('DOMContentLoaded', () => {
    const centers = loadAllCentersData();
    createCenterCards(centers);
    updateCityFilter();
}); 