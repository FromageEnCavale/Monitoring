if ('serviceWorker' in navigator) {

    window.addEventListener('load', () => {

        navigator.serviceWorker.register('/service-worker.js').then(reg => console.log('SW inscrit:', reg.scope)).catch(err => console.error('Échec inscription SW:', err));

    });

}

document.addEventListener('DOMContentLoaded', () => {

    let state = {

        currentView: 'students',

        currentLevel: 'PS',

        editingStudentId: null,

        data: {

            students: [],

            activities: []

        }

    };

    const mainView = document.getElementById('main-view');

    const studentDetailView = document.getElementById('student-detail-view');

    const mainNavButtons = document.querySelectorAll('#main-nav button');

    const levelNavButtons = document.querySelectorAll('#level-nav button');

    const listsContainer = document.getElementById('lists-container');

    const fabAdd = document.getElementById('fab-add');

    const backToListBtn = document.getElementById('back-to-list-btn');

    const modalContainer = document.getElementById('modal-container');

    const modalTitle = document.getElementById('modal-title');

    const modalForm = document.getElementById('modal-form');

    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    const modalSaveBtn = document.getElementById('modal-save-btn');

    const studentDetailName = document.getElementById('student-detail-name');

    const studentDetailContent = document.getElementById('student-detail-content');

    const editStudentBtn = document.getElementById('edit-student-btn');

    const deleteStudentBtn = document.getElementById('delete-student-btn');

    function saveData() {

        localStorage.setItem('schoolAppData', JSON.stringify(state.data));

    }

    function loadData() {

        const data = localStorage.getItem('schoolAppData');

        if (data) {

            state.data = JSON.parse(data);

        }

    }

    function render() {

        listsContainer.innerHTML = '';

        if (state.currentView === 'students') {

            renderStudentsList();

        } else {

            renderActivitiesList();

        }

        updateNavButtons();

    }

    function renderStudentsList() {

        const ul = document.createElement('ul');

        ul.className = 'item-list';

        const filteredStudents = state.data.students.filter(s => s.level === state.currentLevel).sort((a, b) => a.firstName.localeCompare(b.firstName));

        if (filteredStudents.length === 0) {

            ul.innerHTML = `<li class="empty">Aucun élève en ${state.currentLevel}</li>`;

        } else {

            filteredStudents.forEach(student => {

                const li = document.createElement('li');

                li.textContent = student.firstName;

                li.dataset.studentId = student.id;

                li.addEventListener('click', () => showStudentDetail(student.id));

                ul.appendChild(li);

            });

        }

        listsContainer.appendChild(ul);

    }

    function renderActivitiesList() {

        const ul = document.createElement('ul');

        ul.className = 'item-list';

        const filteredActivities = state.data.activities.filter(a => a.level === state.currentLevel).sort((a, b) => b.createdAt - a.createdAt); // Newest first

        if (filteredActivities.length === 0) {

            ul.innerHTML = `<li class="empty">Aucune activité en ${state.currentLevel}</li>`;

        } else {

            filteredActivities.forEach(activity => {

                const li = document.createElement('li');

                li.innerHTML = `
        
                    <span>${activity.name}</span>
                    <button class="delete-activity-btn" data-activity-id="${activity.id}"></button>
        
                `;

                li.querySelector('.delete-activity-btn').addEventListener('click', (e) => {

                    e.stopPropagation();

                    deleteActivity(activity.id);

                });

                ul.appendChild(li);

            });

        }

        listsContainer.appendChild(ul);

    }

    function renderStudentDetail(studentId) {

        const student = state.data.students.find(s => s.id === studentId);

        if (!student) return;

        state.editingStudentId = studentId;

        studentDetailName.textContent = student.firstName;

        const activitiesForLevel = state.data.activities.filter(a => a.level === student.level).sort((a, b) => b.createdAt - a.createdAt);

        studentDetailContent.innerHTML = `
            
            <div class="student-info">
                <div>Informations</div>
                <p>Prénom Nom : ${student.firstName} ${student.lastName || ''}</p>
                ${student.phone1 ? `<a href="tel:${student.phone1}">Numéro Tél : ${student.phone1}</a>` : ''}
                ${student.phone2 ? `<a href="tel:${student.phone2}">Numéro Tél : ${student.phone2}</a>` : ''}
                ${student.medicalInfo ? `<p>PAI : ${student.medicalInfo}</p>` : ''}
                ${student.note ? `<p>Note : ${student.note}</p>` : ''}
                ${!student.phone1 && !student.phone2 && !student.medicalInfo && !student.note ? '<p>Aucune information complémentaire</p>' : ''}
            </div>
            <ul class="item-list">
                ${activitiesForLevel.length > 0 ? activitiesForLevel.map(activity => {
                    const status = student.activityStatus[activity.id] || 'none';
                    const statusClass = status !== 'none' ? `status-${status}` : '';
                    return `<li class="activity-status ${statusClass}" data-activity-id="${activity.id}">${activity.name}</li>`;
                }).join('') : '<li class="empty">Aucune activité pour ce niveau</li>'}
            </ul>
        
        `;

        studentDetailContent.querySelectorAll('.activity-status').forEach(li => {
            
            li.addEventListener('click', toggleActivityStatus);
        
        });
    
    }

    function updateNavButtons() {
    
        mainNavButtons.forEach(btn => {
    
            btn.classList.toggle('active', btn.dataset.view === state.currentView);
    
        });
    
        levelNavButtons.forEach(btn => {
    
            btn.classList.toggle('active', btn.dataset.level === state.currentLevel);
    
        });
    
    }

    function showMainView() {
    
        mainView.hidden = false;
    
        studentDetailView.hidden = true;
    
        state.editingStudentId = null;
    
        render();
    
    }

    function showStudentDetail(studentId) {
    
        mainView.hidden = true;
    
        studentDetailView.hidden = false;
    
        renderStudentDetail(studentId);
    
    }

    function showModal(type, studentId = null) {
    
        state.editingStudentId = studentId;
    
        if (type === 'addStudent') {
    
            modalTitle.textContent = `Ajouter un élève en ${state.currentLevel}`;
    
            modalForm.innerHTML = `
    
                <div class="form-group">
                    <label for="firstName">Prénom <span>(obligatoire)</span></label>
                    <input type="text" id="firstName" placeholder="Jean" required>
                </div>
                <div class="form-group">
                    <label for="lastName">Nom</label>
                    <input type="text" id="lastName" placeholder="Picard">
                </div>
                <div class="form-group">
                    <label for="phone1">Numéro Tél</label>
                    <input type="tel" id="phone1" placeholder="06 80 4. .. ..">
                </div>
                 <div class="form-group">
                    <label for="phone2">Numéro Tél</label>
                    <input type="tel" id="phone2" placeholder="06 21 1. .. ..">
                </div>
                <div class="form-group">
                    <label for="medicalInfo">PAI</label>
                    <input id="medicalInfo" type="text" placeholder="Amoxicilline">
                </div>
                <div class="form-group">
                    <label for="note">Note</label>
                    <input id="note" type="text" placeholder="Note">
                </div>
    
            `;
    
        } else if (type === 'editStudent') {
    
            const student = state.data.students.find(s => s.id === studentId);
    
            modalTitle.textContent = `Modifier l'élève ${student.firstName}`;
    
            modalForm.innerHTML = `
    
                <input type="hidden" id="studentId" value="${student.id}">
                <div class="form-group">
                    <label for="firstName">Prénom <span>(obligatoire)</span></label>
                    <input type="text" id="firstName" placeholder="Jean" value="${student.firstName}" required>
                </div>
                <div class="form-group">
                    <label for="lastName">Nom</label>
                    <input type="text" id="lastName" placeholder="Picard" value="${student.lastName || ''}">
                </div>
                <div class="form-group">
                    <label for="phone1">Numéro Tél</label>
                    <input type="tel" id="phone1" placeholder="06 80 4. .. .." value="${student.phone1 || ''}">
                </div>
                <div class="form-group">
                    <label for="phone2">Numéro Tél</label>
                    <input type="tel" id="phone2" placeholder="06 21 1. .. .." value="${student.phone2 || ''}">
                </div>
                <div class="form-group">
                    <label for="medicalInfo">PAI</label>
                    <input type="text" id="medicalInfo" placeholder="Amoxicilline" value="${student.medicalInfo || ''}">
                </div>
                <div class="form-group">
                    <label for="note">Note</label>
                    <input type="text" id="note" placeholder="Note" value="${student.note || ''}">
                </div>
            
            `;
        
        } else if (type === 'addActivity') {
        
            modalTitle.textContent = `Créer une activité en ${state.currentLevel}`;
        
            modalForm.innerHTML = `
        
                <div class="form-group">
                    <label for="activityName">Intitulé de l'activité</label>
                    <input type="text" id="activityName" placeholder="Savoir compter de 1 à 5 sa..." required>
                </div>
        
            `;
        
        }
        
        modalContainer.hidden = false;
    
    }

    function hideModal() {
    
        modalContainer.hidden = true;
    
        modalTitle.textContent = '';
    
        modalForm.innerHTML = '';
    
        state.editingStudentId = null;
    
    }

    mainNavButtons.forEach(btn => {
    
        btn.addEventListener('click', () => {
    
            state.currentView = btn.dataset.view;
    
            render();
    
        });
    
    });

    levelNavButtons.forEach(btn => {
    
        btn.addEventListener('click', () => {
    
            state.currentLevel = btn.dataset.level;
    
            render();
    
        });
    
    });

    fabAdd.addEventListener('click', () => {
    
        if (state.currentView === 'students') {
    
            showModal('addStudent');
    
        } else {
    
            showModal('addActivity');
    
        }
    
    });

    modalCancelBtn.addEventListener('click', hideModal);
    
    backToListBtn.addEventListener('click', showMainView);

    modalForm.addEventListener('submit', (e) => {
    
        e.preventDefault();
    
        if (state.currentView === 'students') {
    
            saveStudent();
    
        } else {
    
            saveActivity();
    
        }
    
    });
    
    modalSaveBtn.addEventListener('click', () => modalForm.requestSubmit());

    editStudentBtn.addEventListener('click', () => {
    
        showModal('editStudent', state.editingStudentId);
    
    });

    deleteStudentBtn.addEventListener('click', () => {
    
        if (confirm('Voulez-vous vraiment supprimer cet élève ? Cette action est irréversible.')) {
    
            state.data.students = state.data.students.filter(s => s.id !== state.editingStudentId);
    
            saveData();
    
            showMainView();
    
        }
    
    });

    function saveStudent() {
    
        const firstName = document.getElementById('firstName').value.trim();
    
        if (!firstName) {
    
            alert('Le prénom est obligatoire.');
    
            return;
    
        }

        const studentData = {
    
            firstName,
    
            lastName: document.getElementById('lastName').value.trim(),
    
            phone1: document.getElementById('phone1').value.trim(),
    
            phone2: document.getElementById('phone2').value.trim(),
    
            medicalInfo: document.getElementById('medicalInfo').value.trim(),
            
            note: document.getElementById('note').value.trim(),
        
        };

        let currentId = state.editingStudentId;

        if (state.editingStudentId && document.getElementById('studentId')) {
        
            currentId = document.getElementById('studentId').value;
        
            const studentIndex = state.data.students.findIndex(s => s.id === currentId);
        
            state.data.students[studentIndex] = {...state.data.students[studentIndex], ...studentData};
        
        } else {
        
            const newStudent = {
        
                ...studentData,
        
                id: Date.now().toString(),
        
                level: state.currentLevel,
        
                activityStatus: {}
        
            };
        
            state.data.students.push(newStudent);
        
            currentId = newStudent.id;
        
        }

        saveData();
        
        hideModal();

        if (studentDetailView.hidden) {
        
            render();
        
        } else {
        
            showStudentDetail(currentId);
        
        }
    
    }

    function saveActivity() {
    
        const name = document.getElementById('activityName').value.trim();
    
        if (!name) {
    
            alert("Le nom de l'activité est obligatoire.");
    
            return;
    
        }
    
        const newActivity = {
    
            id: Date.now().toString(),
    
            name,
    
            level: state.currentLevel,
    
            createdAt: Date.now()
    
        };
    
        state.data.activities.push(newActivity);
    
        saveData();
    
        hideModal();
    
        render();
    
    }

    function deleteActivity(activityId) {
    
        if (confirm("Voulez-vous vraiment supprimer cette activité ? Elle sera retirée de tous les élèves.")) {
    
            state.data.activities = state.data.activities.filter(a => a.id !== activityId);
    
            state.data.students.forEach(student => {
    
                if (student.activityStatus[activityId]) {
    
                    delete student.activityStatus[activityId];
    
                }
    
            });
    
            saveData();
    
            render();
    
        }
    
    }

    function toggleActivityStatus(e) {
    
        const li = e.currentTarget;
    
        const activityId = li.dataset.activityId;
    
        const student = state.data.students.find(s => s.id === state.editingStudentId);

        const currentStatus = student.activityStatus[activityId] || 'none';
    
        let nextStatus;

        if (currentStatus === 'none') nextStatus = 'acquired';
        
        else if (currentStatus === 'acquired') nextStatus = 'not-acquired';
        
        else nextStatus = 'none';

        if (nextStatus === 'none') {
        
            delete student.activityStatus[activityId];
        
        } else {
        
            student.activityStatus[activityId] = nextStatus;
        
        }

        li.classList.remove('status-acquired', 'status-not-acquired');
        
        if (nextStatus !== 'none') {
        
            li.classList.add(`status-${nextStatus}`);
        
        }

        saveData();
    
    }
    
    function init() {
    
        loadData();
    
        showMainView();
    
        updateBodyClass();
    
    }

    init();

});