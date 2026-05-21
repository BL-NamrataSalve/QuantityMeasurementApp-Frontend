/**
 * QuantumMeasure - Frontend Controller Orchestrator
 * Connects UI tabs, forms, event handlers, and Local Storage data bindings.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Current application state
    const appState = {
        currentUser: null,
        currentCategory: 'LENGTH'
    };

    // DOM Elements Cache
    const dom = {
        themeToggle: document.getElementById('theme-toggle'),
        userProfile: document.getElementById('user-profile'),
        profileName: document.getElementById('profile-name'),
        profileEmail: document.getElementById('profile-email'),
        avatarLetters: document.getElementById('avatar-letters'),
        logoutBtn: document.getElementById('logout-btn'),
        
        authSection: document.getElementById('auth-section'),
        dashboardSection: document.getElementById('dashboard-section'),
        
        // Authentication Widgets
        tabLogin: document.getElementById('tab-login'),
        tabRegister: document.getElementById('tab-register'),
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        authError: document.getElementById('auth-error'),
        authSuccess: document.getElementById('auth-success'),
        
        // Category selections
        categoryCards: document.querySelectorAll('.category-card'),
        
        // Workspaces
        opError: document.getElementById('op-error'),
        opsTabs: document.querySelectorAll('.ops-tab'),
        tabContentConvert: document.getElementById('tab-content-convert'),
        tabContentArithmetic: document.getElementById('tab-content-arithmetic'),
        tabContentCompare: document.getElementById('tab-content-compare'),
        
        // Form: Convert
        convertForm: document.getElementById('convert-form'),
        convertVal: document.getElementById('convert-val'),
        convertFromUnit: document.getElementById('convert-from-unit'),
        convertToUnit: document.getElementById('convert-to-unit'),
        convertResultBox: document.getElementById('convert-result-box'),
        convertResultText: document.getElementById('convert-result-text'),
        
        // Form: Arithmetic
        arithmeticForm: document.getElementById('arithmetic-form'),
        arithmeticVal1: document.getElementById('arithmetic-val1'),
        arithmeticUnit1: document.getElementById('arithmetic-unit1'),
        arithmeticVal2: document.getElementById('arithmetic-val2'),
        arithmeticUnit2: document.getElementById('arithmetic-unit2'),
        arithmeticTargetUnit: document.getElementById('arithmetic-target-unit'),
        arithmeticWarning: document.getElementById('arithmetic-warning'),
        secondQuantityRow: document.getElementById('second-quantity-row'),
        secondUnitWrapper: document.getElementById('second-unit-wrapper'),
        targetUnitRow: document.getElementById('target-unit-row'),
        val2Label: document.getElementById('val2-label'),
        arithmeticResultBox: document.getElementById('arithmetic-result-box'),
        arithmeticResultText: document.getElementById('arithmetic-result-text'),
        tabBtnArithmetic: document.getElementById('btn-tab-arithmetic'),
        
        // Form: Compare
        compareForm: document.getElementById('compare-form'),
        compareVal1: document.getElementById('compare-val1'),
        compareUnit1: document.getElementById('compare-unit1'),
        compareVal2: document.getElementById('compare-val2'),
        compareUnit2: document.getElementById('compare-unit2'),
        compareResultBox: document.getElementById('compare-result-box'),
        compareStatusBadge: document.getElementById('compare-status-badge'),
        
        // Sidebar Widgets
        statConverts: document.getElementById('stat-converts'),
        statOps: document.getElementById('stat-ops'),
        
        // History List
        historyFilter: document.getElementById('history-filter'),
        btnClearHistory: document.getElementById('btn-clear-history'),
        historyBody: document.getElementById('history-body')
    };

    // ==========================================================================
    // INITIALIZATION & SESSION CHECKS
    // ==========================================================================
    function checkSession() {
        const user = AuthService.getProfile();
        if (user) {
            appState.currentUser = user;
            renderAuthViewState(true);
        } else {
            appState.currentUser = null;
            renderAuthViewState(false);
        }
    }

    function renderAuthViewState(isLoggedIn) {
        if (isLoggedIn && appState.currentUser) {
            dom.authSection.classList.add('hidden');
            dom.dashboardSection.classList.remove('hidden');
            dom.userProfile.classList.remove('hidden');
            
            // Set User Details in Header Dropdown
            const name = appState.currentUser.name;
            dom.profileName.textContent = name;
            dom.profileEmail.textContent = appState.currentUser.email;
            
            // Avatar Letters
            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            dom.avatarLetters.textContent = initials;
            
            // Load and Sync user statistics & history
            updateUnitsDropdowns();
            refreshStats();
            refreshHistory();
        } else {
            dom.authSection.classList.remove('hidden');
            dom.dashboardSection.classList.add('hidden');
            dom.userProfile.classList.add('hidden');
            resetAuthForms();
        }
    }

    function resetAuthForms() {
        dom.loginForm.reset();
        dom.registerForm.reset();
        hideMessage(dom.authError);
        hideMessage(dom.authSuccess);
    }

    // ==========================================================================
    // AUTHENTICATION CONTROLS
    // ==========================================================================
    // Switch between Login and Register views
    dom.tabLogin.addEventListener('click', () => {
        dom.tabLogin.classList.add('active');
        dom.tabRegister.classList.remove('active');
        dom.loginForm.classList.add('active');
        dom.registerForm.classList.remove('active');
        hideMessage(dom.authError);
    });

    dom.tabRegister.addEventListener('click', () => {
        dom.tabRegister.classList.add('active');
        dom.tabLogin.classList.remove('active');
        dom.registerForm.classList.add('active');
        dom.loginForm.classList.remove('active');
        hideMessage(dom.authError);
    });

    // Handle Login Submit
    dom.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        hideMessage(dom.authError);
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        showSpinner(dom.loginForm);

        AuthService.login(email, password)
            .then(user => {
                showMessage(dom.authSuccess, 'Access Granted. Entering Dashboard...');
                setTimeout(() => {
                    appState.currentUser = user;
                    renderAuthViewState(true);
                }, 500);
            })
            .catch(err => {
                showMessage(dom.authError, err.message);
            })
            .finally(() => {
                hideSpinner(dom.loginForm);
            });
    });

    // Handle Register Submit
    dom.registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        hideMessage(dom.authError);
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        showSpinner(dom.registerForm);

        AuthService.register(name, email, password)
            .then(user => {
                showMessage(dom.authSuccess, 'Account created successfully!');
                setTimeout(() => {
                    appState.currentUser = user;
                    renderAuthViewState(true);
                }, 500);
            })
            .catch(err => {
                showMessage(dom.authError, err.message);
            })
            .finally(() => {
                hideSpinner(dom.registerForm);
            });
    });

    // Log Out
    dom.logoutBtn.addEventListener('click', () => {
        AuthService.logout();
        appState.currentUser = null;
        renderAuthViewState(false);
    });

    // Toggle Themes (Light vs Dark)
    dom.themeToggle.addEventListener('click', () => {
        const root = document.documentElement;
        const theme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', theme);
    });

    // ==========================================================================
    // DASHBOARD AND COMPUTATION CONTROLS
    // ==========================================================================
    // Switch between Length, Weight, Volume, Temperature categories
    dom.categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            dom.categoryCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            appState.currentCategory = card.getAttribute('data-category');
            updateUnitsDropdowns();
            hideMessage(dom.opError);
            
            // Clean outputs
            dom.convertResultBox.classList.add('hidden');
            dom.arithmeticResultBox.classList.add('hidden');
            dom.compareResultBox.classList.add('hidden');
            
            // Disable or warning on Arithmetic for Temperature
            if (appState.currentCategory === 'TEMPERATURE') {
                dom.arithmeticForm.classList.add('hidden');
                dom.arithmeticWarning.classList.remove('hidden');
            } else {
                dom.arithmeticForm.classList.remove('hidden');
                dom.arithmeticWarning.classList.add('hidden');
            }
        });
    });

    // Switch Operations workspace tabs
    dom.opsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            dom.opsTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const activeTab = tab.getAttribute('data-tab');
            
            // Hide all tab screens
            dom.tabContentConvert.classList.remove('active');
            dom.tabContentArithmetic.classList.remove('active');
            dom.tabContentCompare.classList.remove('active');
            
            // Show selected screen
            if (activeTab === 'convert') dom.tabContentConvert.classList.add('active');
            if (activeTab === 'arithmetic') dom.tabContentArithmetic.classList.add('active');
            if (activeTab === 'compare') dom.tabContentCompare.classList.add('active');
            
            hideMessage(dom.opError);
        });
    });

    // Setup Arithmetic operations layout options (Divide doesn't need unit select/target unit)
    document.querySelectorAll('input[name="arithmetic-op"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const op = e.target.value;
            if (op === 'DIVIDE') {
                dom.secondUnitWrapper.classList.add('hidden');
                dom.targetUnitRow.classList.add('hidden');
                dom.val2Label.textContent = 'Divisor (Scalar Number)';
                dom.arithmeticVal2.value = '';
                dom.arithmeticVal2.placeholder = 'e.g., 2';
            } else {
                dom.secondUnitWrapper.classList.remove('hidden');
                dom.targetUnitRow.classList.remove('hidden');
                dom.val2Label.textContent = 'Second Value';
                dom.arithmeticVal2.placeholder = ' ';
            }
        });
    });

    // Update Dropdown Options dynamically
    function updateUnitsDropdowns() {
        const units = Object.keys(QuantityConverter.UNITS[appState.currentCategory]);
        
        const dropdowns = [
            dom.convertFromUnit,
            dom.convertToUnit,
            dom.arithmeticUnit1,
            dom.arithmeticUnit2,
            dom.arithmeticTargetUnit,
            dom.compareUnit1,
            dom.compareUnit2
        ];

        dropdowns.forEach(select => {
            select.innerHTML = '';
            units.forEach(unit => {
                const option = document.createElement('option');
                option.value = unit;
                option.textContent = capitalizeString(unit);
                select.appendChild(option);
            });
        });

        // Offset defaults to avoid same units at load
        if (units.length > 1) {
            dom.convertToUnit.selectedIndex = 1;
            dom.arithmeticUnit2.selectedIndex = 1;
            dom.compareUnit2.selectedIndex = 1;
        }
    }

    // Submit Action: Convert
    dom.convertForm.addEventListener('submit', (e) => {
        e.preventDefault();
        hideMessage(dom.opError);
        dom.convertResultBox.classList.add('hidden');

        const value = parseFloat(dom.convertVal.value);
        const fromUnit = dom.convertFromUnit.value;
        const toUnit = dom.convertToUnit.value;

        try {
            if (isNaN(value)) throw new Error('Value must be a valid number.');
            
            const result = QuantityConverter.convert(value, fromUnit, toUnit);
            
            // Render Result
            dom.convertResultText.textContent = `${result.toFixed(2)} ${capitalizeString(toUnit)}`;
            dom.convertResultBox.classList.remove('hidden');

            // Log history
            HistoryService.logOperation({
                userEmail: appState.currentUser.email,
                operationType: 'CONVERSION',
                firstQuantityValue: value,
                firstUnit: fromUnit,
                secondQuantityValue: 0,
                secondUnit: toUnit,
                resultQuantityValue: result,
                resultUnit: toUnit
            })
            .then(() => {
                refreshStats();
                refreshHistory();
            })
            .catch(err => {
                showMessage(dom.opError, err.message);
            });
        } catch (err) {
            showMessage(dom.opError, err.message);
        }
    });

    // Submit Action: Arithmetic (Add, Subtract, Divide)
    dom.arithmeticForm.addEventListener('submit', (e) => {
        e.preventDefault();
        hideMessage(dom.opError);
        dom.arithmeticResultBox.classList.add('hidden');

        const val1 = parseFloat(dom.arithmeticVal1.value);
        const unit1 = dom.arithmeticUnit1.value;
        const op = document.querySelector('input[name="arithmetic-op"]:checked').value;
        const val2 = parseFloat(dom.arithmeticVal2.value);

        try {
            if (isNaN(val1)) throw new Error('First value must be a valid number.');
            if (isNaN(val2)) throw new Error(op === 'DIVIDE' ? 'Divisor must be a valid number.' : 'Second value must be a valid number.');

            let resultVal = 0;
            let resultUnit = unit1;
            let logPromise;
            
            if (op === 'ADD') {
                const unit2 = dom.arithmeticUnit2.value;
                const target = dom.arithmeticTargetUnit.value;
                const res = QuantityConverter.add(val1, unit1, val2, unit2, target);
                resultVal = res.value;
                resultUnit = res.unit;

                logPromise = HistoryService.logOperation({
                    userEmail: appState.currentUser.email,
                    operationType: 'ADDITION',
                    firstQuantityValue: val1,
                    firstUnit: unit1,
                    secondQuantityValue: val2,
                    secondUnit: unit2,
                    resultQuantityValue: resultVal,
                    resultUnit: resultUnit
                });
            } else if (op === 'SUBTRACT') {
                const unit2 = dom.arithmeticUnit2.value;
                const target = dom.arithmeticTargetUnit.value;
                const res = QuantityConverter.subtract(val1, unit1, val2, unit2, target);
                resultVal = res.value;
                resultUnit = res.unit;

                logPromise = HistoryService.logOperation({
                    userEmail: appState.currentUser.email,
                    operationType: 'SUBTRACTION',
                    firstQuantityValue: val1,
                    firstUnit: unit1,
                    secondQuantityValue: val2,
                    secondUnit: unit2,
                    resultQuantityValue: resultVal,
                    resultUnit: resultUnit
                });
            } else if (op === 'DIVIDE') {
                if (val2 === 0) throw new Error('Division by zero is not allowed.');
                resultVal = QuantityConverter.divide(val1, unit1, val2);
                resultUnit = unit1;

                logPromise = HistoryService.logOperation({
                    userEmail: appState.currentUser.email,
                    operationType: 'DIVISION',
                    firstQuantityValue: val1,
                    firstUnit: unit1,
                    secondQuantityValue: val2,
                    secondUnit: 'DIVISOR',
                    resultQuantityValue: resultVal,
                    resultUnit: resultUnit
                });
            }

            if (logPromise) {
                logPromise
                    .then(() => {
                        dom.arithmeticResultText.textContent = `${resultVal.toFixed(2)} ${capitalizeString(resultUnit)}`;
                        dom.arithmeticResultBox.classList.remove('hidden');
                        refreshStats();
                        refreshHistory();
                    })
                    .catch(err => {
                        showMessage(dom.opError, err.message);
                    });
            }
        } catch (err) {
            showMessage(dom.opError, err.message);
        }
    });

    // Submit Action: Compare
    dom.compareForm.addEventListener('submit', (e) => {
        e.preventDefault();
        hideMessage(dom.opError);
        dom.compareResultBox.classList.add('hidden');

        const val1 = parseFloat(dom.compareVal1.value);
        const unit1 = dom.compareUnit1.value;
        const val2 = parseFloat(dom.compareVal2.value);
        const unit2 = dom.compareUnit2.value;

        try {
            if (isNaN(val1) || isNaN(val2)) throw new Error('Values must be valid numbers.');

            const isEqual = QuantityConverter.compare(val1, unit1, val2, unit2);
            
            const badge = dom.compareStatusBadge;
            const textSpan = badge.querySelector('.badge-text');

            if (isEqual) {
                textSpan.textContent = 'EQUAL';
                badge.className = 'comparison-status equal';
            } else {
                textSpan.textContent = 'NOT EQUAL';
                badge.className = 'comparison-status not-equal';
            }

            dom.compareResultBox.classList.remove('hidden');

            // Log Compare operation
            HistoryService.logOperation({
                userEmail: appState.currentUser.email,
                operationType: 'COMPARISON',
                firstQuantityValue: val1,
                firstUnit: unit1,
                secondQuantityValue: val2,
                secondUnit: unit2,
                resultQuantityValue: isEqual ? 1.0 : 0.0,
                resultUnit: isEqual ? 'EQUAL' : 'NOT_EQUAL'
            })
            .then(() => {
                refreshStats();
                refreshHistory();
            })
            .catch(err => {
                showMessage(dom.opError, err.message);
            });
        } catch (err) {
            showMessage(dom.opError, err.message);
        }
    });

    // Clear History Button Click
    dom.btnClearHistory.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all operation records for this account?')) {
            HistoryService.clearHistory(appState.currentUser.email)
                .then(() => {
                    refreshStats();
                    refreshHistory();
                })
                .catch(err => alert(err.message));
        }
    });



    // Filter History Selector change
    dom.historyFilter.addEventListener('change', () => {
        refreshHistory();
    });

    // ==========================================================================
    // SYNCING VISUAL STATES & RENDER ENGINE
    // ==========================================================================
    function refreshStats() {
        if (!appState.currentUser) return;
        HistoryService.getStats(appState.currentUser.email)
            .then(({ converts, calculations }) => {
                dom.statConverts.textContent = converts;
                dom.statOps.textContent = calculations;
            })
            .catch(err => console.error(err));
    }

    function refreshHistory() {
        if (!appState.currentUser) return;
        const filter = dom.historyFilter.value;
        HistoryService.getHistory(appState.currentUser.email, filter)
            .then(logs => {
                renderHistoryList(logs);
            })
            .catch(err => console.error(err));
    }

    function renderHistoryList(logs) {
        const body = dom.historyBody;
        body.innerHTML = '';

        if (!logs || logs.length === 0) {
            body.innerHTML = `<tr><td colspan="5" class="table-empty">No history logs found. Perform some operations to get started.</td></tr>`;
            return;
        }

        logs.forEach(log => {
            const tr = document.createElement('tr');
            
            // Format timestamp
            const dateStr = new Date(log.timestamp).toLocaleString();
            
            // Badges
            const badgeClass = `badge badge-${log.operationType.toLowerCase()}`;
            
            let firstQty = `${log.firstQuantityValue} ${capitalizeString(log.firstUnit)}`;
            let secondQty = '';
            
            if (log.operationType === 'CONVERSION') {
                secondQty = `Target: ${capitalizeString(log.secondUnit)}`;
            } else if (log.operationType === 'DIVISION') {
                secondQty = `Divisor: ${log.secondQuantityValue}`;
            } else {
                secondQty = `${log.secondQuantityValue} ${capitalizeString(log.secondUnit)}`;
            }

            let resultStr = `${log.resultQuantityValue.toFixed(2)} ${capitalizeString(log.resultUnit)}`;
            if (log.operationType === 'COMPARISON') {
                resultStr = log.resultUnit === 'EQUAL' ? 'EQUAL' : 'NOT EQUAL';
            }

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><span class="${badgeClass}">${capitalizeString(log.operationType)}</span></td>
                <td>${firstQty}</td>
                <td>${secondQty}</td>
                <td><strong>${resultStr}</strong></td>
            `;
            body.appendChild(tr);
        });
    }

    // ==========================================================================
    // UTILITY HELPER METHODS
    // ==========================================================================
    function capitalizeString(str) {
        if (!str) return '';
        return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }

    function showMessage(element, msg) {
        element.textContent = msg;
        element.classList.remove('hidden');
    }

    function hideMessage(element) {
        element.classList.add('hidden');
        element.textContent = '';
    }

    function showSpinner(form) {
        const btn = form.querySelector('.submit-btn');
        if (btn) {
            btn.querySelector('span').classList.add('hidden');
            btn.querySelector('.spinner').classList.remove('hidden');
            btn.disabled = true;
        }
    }

    function hideSpinner(form) {
        const btn = form.querySelector('.submit-btn');
        if (btn) {
            btn.querySelector('span').classList.remove('hidden');
            btn.querySelector('.spinner').classList.add('hidden');
            btn.disabled = false;
        }
    }

    // Run Initial checks
    checkSession();
});
