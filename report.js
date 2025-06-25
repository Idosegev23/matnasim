// פונקציה לאיסוף כל השאלות מכל השאלונים
async function generateFullReport() {
    const questionnaires = [
        { name: 'אבטחת מידע', file: 'security.html' },
        { name: 'נגישות', file: 'accessibility.html' },
        { name: 'תקציב', file: 'budget.html' },
        { name: 'הנהלת חשבונות', file: 'accounting.html' },
        { name: 'סגרות', file: 'sgarot.html' },
        { name: 'מלאי', file: 'inventory.html' },
        { name: 'משפטי', file: 'legal.html' },
        { name: 'רישום', file: 'registration.html' },
        { name: 'נוער', file: 'youth.html' },
        { name: 'שכר', file: 'salary.html' },
        { name: 'ניהול פיננסי', file: 'financial_management.html' },
        { name: 'ניהול משאבי אנוש', file: 'hr_management.html' },
        { name: 'קהילה', file: 'community.html' }
    ];

    const fullReport = {
        timestamp: new Date().toISOString(),
        questionnaires: {}
    };

    for (const questionnaire of questionnaires) {
        try {
            const response = await fetch(questionnaire.file);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const questions = [];
            doc.querySelectorAll('.question-group').forEach((group, index) => {
                const questionText = group.querySelector('.question-text')?.textContent.trim();
                if (questionText) {
                    questions.push({
                        number: index + 1,
                        question: questionText
                    });
                }
            });

            fullReport.questionnaires[questionnaire.name] = {
                totalQuestions: questions.length,
                questions: questions
            };
        } catch (error) {
            console.error(`שגיאה בטעינת השאלון ${questionnaire.name}:`, error);
        }
    }

    return fullReport;
}

// פונקציה להצגת הדוח בצורה מסודרת
function displayReport(report) {
    const container = document.getElementById('report-container');
    if (!container) return;

    let html = `<h1>דוח מפורט - שאלוני ניהול ובקרה</h1>
                <p>נוצר בתאריך: ${new Date(report.timestamp).toLocaleString('he-IL')}</p>`;

    for (const [name, data] of Object.entries(report.questionnaires)) {
        html += `
            <div class="questionnaire-section">
                <h2>${name}</h2>
                <p>סה"כ שאלות: ${data.totalQuestions}</p>
                <div class="questions-list">
                    ${data.questions.map(q => `
                        <div class="question-item">
                            <span class="question-number">${q.number}.</span>
                            <span class="question-text">${q.question}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// הפעלת הדוח בטעינת הדף
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const report = await generateFullReport();
        displayReport(report);
        
        // שמירת הדוח ב-localStorage
        localStorage.setItem('fullQuestionnairesReport', JSON.stringify(report));
        
        // הוספת כפתור להורדת הדוח כקובץ JSON
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'הורד דוח JSON';
        downloadBtn.className = 'download-btn';
        downloadBtn.onclick = () => {
            const dataStr = JSON.stringify(report, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `questionnaires-report-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
        document.getElementById('report-container').prepend(downloadBtn);
    } catch (error) {
        console.error('שגיאה ביצירת הדוח:', error);
        document.getElementById('report-container').innerHTML = '<p class="error">אירעה שגיאה ביצירת הדוח. אנא נסה שוב מאוחר יותר.</p>';
    }
}); 