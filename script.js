document.addEventListener('DOMContentLoaded', () => {
    // מאזין לשינויים בטופס
    const form = document.querySelector('form');
    const radioInputs = document.querySelectorAll('input[type="radio"]');
    const textareas = document.querySelectorAll('textarea');
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');

    // פונקציה לחישוב התקדמות הטופס
    function calculateProgress() {
        const totalQuestions = document.querySelectorAll('.question-group').length;
        const answeredQuestions = document.querySelectorAll('input[type="radio"]:checked').length;
        const progress = (answeredQuestions / totalQuestions) * 100;
    
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}%`;
}

    // פונקציה להצגת שדות טקסט נוספים
    function toggleFollowUp(radioInput) {
        const questionGroup = radioInput.closest('.question-group');
        const followUp = questionGroup.querySelector('.follow-up');
        
        if (radioInput.value === 'no' && followUp) {
            followUp.classList.add('show');
            followUp.querySelector('textarea').required = true;
        } else if (followUp) {
            followUp.classList.remove('show');
            followUp.querySelector('textarea').required = false;
            followUp.querySelector('textarea').value = '';
        }
    }

    // מאזין לשינויים ברדיו באטנים
    radioInputs.forEach(radio => {
        radio.addEventListener('change', (e) => {
            toggleFollowUp(e.target);
            calculateProgress();
            saveFormData();
        });
    });

    // מאזין לשינויים בשדות טקסט
    textareas.forEach(textarea => {
        textarea.addEventListener('input', saveFormData);
    });

    // שמירת נתונים ב-localStorage
    function saveFormData() {
        const formData = {
            radioSelections: {},
            textareaContent: {}
        };

        // שמירת בחירות רדיו
        radioInputs.forEach(radio => {
            if (radio.checked) {
                formData.radioSelections[radio.name] = radio.value;
            }
        });

        // שמירת תוכן טקסט
        textareas.forEach(textarea => {
            formData.textareaContent[textarea.name] = textarea.value;
        });

        localStorage.setItem('securityFormData', JSON.stringify(formData));
        showAutoSaveStatus();
    }

    // טעינת נתונים מ-localStorage
    function loadFormData() {
        const savedData = localStorage.getItem('securityFormData');
        if (savedData) {
            const formData = JSON.parse(savedData);

            // שחזור בחירות רדיו
            Object.entries(formData.radioSelections).forEach(([name, value]) => {
                const radio = document.querySelector(`input[type="radio"][name="${name}"][value="${value}"]`);
                if (radio) {
                    radio.checked = true;
                    toggleFollowUp(radio);
                }
            });

            // שחזור תוכן טקסט
            Object.entries(formData.textareaContent).forEach(([name, value]) => {
                const textarea = document.querySelector(`textarea[name="${name}"]`);
                if (textarea) {
                    textarea.value = value;
                }
            });

            calculateProgress();
        }
    }

    // הצגת סטטוס שמירה אוטומטית
    function showAutoSaveStatus() {
        const statusElement = document.querySelector('.auto-save-status');
        statusElement.innerHTML = '<i class="fas fa-sync fa-spin"></i> נשמר אוטומטית';
        
        setTimeout(() => {
            statusElement.innerHTML = '<i class="fas fa-sync"></i> התשובות נשמרות אוטומטית';
        }, 1000);
    }

    // טיפול בשליחת הטופס
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // בדיקת תקינות
        const isValid = validateForm();
        
        if (isValid) {
            // שליחת הנתונים לשרת
            submitForm();
        }
    });

    // פונקציית בדיקת תקינות
function validateForm() {
    let isValid = true;
        const questions = document.querySelectorAll('.question-group');
        
        questions.forEach(question => {
            const radios = question.querySelectorAll('input[type="radio"]');
            const followUp = question.querySelector('.follow-up');
            const textarea = followUp ? followUp.querySelector('textarea') : null;
            
            // בדיקת בחירת רדיו
            let radioChecked = false;
            radios.forEach(radio => {
                if (radio.checked) {
                    radioChecked = true;
                }
            });
            
            if (!radioChecked) {
                    isValid = false;
                question.classList.add('invalid');
                } else {
                question.classList.remove('invalid');
            }
            
            // בדיקת מילוי טקסט כשנדרש
            if (textarea && textarea.required && !textarea.value.trim()) {
                isValid = false;
                textarea.classList.add('invalid');
            } else if (textarea) {
                textarea.classList.remove('invalid');
        }
    });

    return isValid;
}

    // פונקציית שליחת הטופס
    function submitForm() {
        const formData = new FormData(form);
        const data = {
            timestamp: new Date().toISOString(),
            answers: {}
        };

        // איסוף כל השאלות והתשובות
        document.querySelectorAll('.question-group').forEach((questionGroup, index) => {
            const questionText = questionGroup.querySelector('.question-text').textContent;
            const selectedRadio = questionGroup.querySelector('input[type="radio"]:checked');
            const followUpTextarea = questionGroup.querySelector('.follow-up textarea');

            data.answers[`question_${index + 1}`] = {
                question: questionText,
                answer: selectedRadio ? selectedRadio.value : null,
                explanation: followUpTextarea && followUpTextarea.value ? followUpTextarea.value : null
            };
        });

        // שליחת הנתונים לוובהוק
        fetch('https://hook.eu2.make.com/kt3y7c3qph58nhcfchsyw1s608qxmnui', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('שגיאה בשליחת הנתונים');
            }
            return response.json();
        })
        .then(() => {
            // ניקוי ה-localStorage לאחר שליחה מוצלחת
            localStorage.removeItem('securityFormData');
            
            // איפוס הטופס
            form.reset();
            document.querySelectorAll('.follow-up').forEach(followUp => {
                followUp.classList.remove('show');
            });
            calculateProgress();
            
            // הצגת הודעת הצלחה
            alert('השאלון נשלח בהצלחה!');
            
            // חזרה לדף הראשי
            window.location.href = 'index.html';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('אירעה שגיאה בשליחת השאלון. אנא נסה שוב.');
        });
    }

    // טעינת נתונים בטעינת הדף
    loadFormData();

    // פונקציה לאיסוף כל התשובות מכל השאלונים
    function collectAllAnswers() {
        const personalDetails = {
            centerName: document.getElementById('centerName')?.value || '',
            managerName: document.getElementById('managerName')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            email: document.getElementById('email')?.value || '',
            address: document.getElementById('address')?.value || '',
            city: document.getElementById('city')?.value || '',
            startYear: document.getElementById('startYear')?.value || ''
        };

        const allQuestionnaires = {
            hr: 'hr_management',
            budget: 'budget',
            financial: 'financial_management',
            salary: 'salary',
            accounting: 'accounting',
            sgarot: 'sgarot',
            inventory: 'inventory',
            registration: 'registration',
            youth: 'youth',
            community: 'community',
            legal: 'legal',
            security: 'security'
        };

        const allAnswers = {};
        
        // איסוף תשובות מכל השאלונים
        for (const [key, name] of Object.entries(allQuestionnaires)) {
            const savedData = localStorage.getItem(`${name}FormData`);
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    allAnswers[name] = {
                        radioSelections: parsedData.radioSelections || {},
                        textareaContent: parsedData.textareaContent || {}
                    };
                } catch (error) {
                    console.error(`שגיאה בטעינת נתונים עבור ${name}:`, error);
                }
            }
        }

        return {
            timestamp: new Date().toISOString(),
            personalDetails,
            questionnaires: allAnswers
        };
    }

    // פונקציה לבדיקת שלמות כל השאלונים
    function validateAllQuestionnaires() {
        const allQuestionnaires = {
            hr_management: 'ניהול משאבי אנוש',
            budget: 'תקציב',
            financial_management: 'ניהול פיננסי',
            salary: 'שכר',
            accounting: 'הנהלת חשבונות',
            sgarot: 'שגרות',
            inventory: 'מלאי',
            registration: 'רישום',
            youth: 'נוער',
            community: 'קהילה',
            legal: 'משפטי',
            security: 'בטיחות'
        };

        const incompleteQuestionnaires = [];

        for (const [key, name] of Object.entries(allQuestionnaires)) {
            const savedData = localStorage.getItem(`${key}FormData`);
            if (!savedData) {
                incompleteQuestionnaires.push(name);
                continue;
            }

            try {
                const parsedData = JSON.parse(savedData);
                const radioSelections = parsedData.radioSelections || {};
                const textareaContent = parsedData.textareaContent || {};

                // בדיקה האם יש שאלות שלא נענו
                const hasIncompleteQuestions = Object.entries(radioSelections).length === 0;
                
                // בדיקה האם חסרים הסברים לתשובות 'לא'
                const hasIncompleteExplanations = Object.entries(radioSelections).some(([question, answer]) => {
                    return answer === 'no' && !textareaContent[`followup_${question}`]?.trim();
                });

                if (hasIncompleteQuestions || hasIncompleteExplanations) {
                    incompleteQuestionnaires.push(name);
                }
            } catch (error) {
                console.error(`שגיאה בבדיקת שאלון ${name}:`, error);
                incompleteQuestionnaires.push(name);
            }
        }

        return incompleteQuestionnaires;
    }

    // עדכון פונקציית submitAllQuestionnaires
    async function submitAllQuestionnaires() {
        const submitButton = document.getElementById('submitAll');
        if (!submitButton) return;

        submitButton.addEventListener('click', async () => {
            try {
                // בדיקת תקינות פרטים אישיים
                const personalDetailsForm = document.getElementById('personalDetailsForm');
                if (!personalDetailsForm.checkValidity()) {
                    alert('אנא מלא את כל פרטי המתנ"ס הנדרשים');
                    return;
                }

                // בדיקת שלמות כל השאלונים
                const incompleteQuestionnaires = validateAllQuestionnaires();
                if (incompleteQuestionnaires.length > 0) {
                    alert(`אנא השלם את מילוי השאלונים הבאים:\n${incompleteQuestionnaires.join('\n')}`);
                    return;
                }

                // איסוף כל התשובות
                const allData = collectAllAnswers();

                // שליחה לוובהוק
                const response = await fetch('https://hook.eu2.make.com/kt3y7c3qph58nhcfchsyw1s608qxmnui', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(allData)
                });

                if (!response.ok) {
                    throw new Error('שגיאה בשליחת הנתונים');
                }

                // ניקוי כל ה-localStorage
                for (const key of Object.keys(allQuestionnaires)) {
                    localStorage.removeItem(`${key}FormData`);
                }

                alert('כל השאלונים נשלחו בהצלחה!');
                
                // איפוס כל הטפסים
                personalDetailsForm.reset();
                updateAllProgress();
                
            } catch (error) {
                console.error('שגיאה בשליחת השאלונים:', error);
                alert('אירעה שגיאה בשליחת השאלונים. אנא נסה שוב.');
            }
        });
    }

    // עדכון פונקציית updateSubmitButton
    function updateSubmitButton() {
        const submitButton = document.getElementById('submitAll');
        if (!submitButton) return;

        const personalDetailsForm = document.getElementById('personalDetailsForm');
        const isPersonalDetailsValid = personalDetailsForm ? personalDetailsForm.checkValidity() : false;
        
        // בדיקת שלמות כל השאלונים
        const incompleteQuestionnaires = validateAllQuestionnaires();
        const areAllQuestionnairesComplete = incompleteQuestionnaires.length === 0;
        
        // אפשור הכפתור רק אם כל השאלונים מלאים והפרטים האישיים תקינים
        submitButton.disabled = !isPersonalDetailsValid || !areAllQuestionnairesComplete;
        
        // עדכון טקסט עזרה אם יש שאלונים לא שלמים
        if (!areAllQuestionnairesComplete) {
            submitButton.title = `יש להשלים את השאלונים הבאים:\n${incompleteQuestionnaires.join('\n')}`;
        } else {
            submitButton.title = '';
        }
    }

    // הוספת מאזינים לטופס הפרטים האישיים
    document.getElementById('personalDetailsForm')?.addEventListener('input', updateSubmitButton);

    // הפעלת פונקציית השליחה
    submitAllQuestionnaires();
    
    // עדכון ראשוני של כפתור השליחה
    updateSubmitButton();
}); 