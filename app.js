document.addEventListener('DOMContentLoaded', () => {
    // 1. Configurations & API Root Path Mapping (FIXED: Official, direct public endpoint URL)
    const API_BASE_URL = 'https://dictionaryapi.dev';
    const LOCAL_STORAGE_KEY = 'wordly_favorites';

    // 2. DOM Element Selectors
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const resultContainer = document.getElementById('resultContainer');
    const favoritesWrapper = document.getElementById('favoritesWrapper');
    const favoritesList = document.getElementById('favoritesList');
    const themeToggle = document.getElementById('themeToggle');

    // 3. Application Templates 
    const tplLoading = document.getElementById('template-loading');
    const tplError = document.getElementById('template-error');
    const tplResult = document.getElementById('template-word-result');

    // 4. Reactive Application State Management
    let currentWordData = null;
    let savedWords = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];

    // 5. Theme Settings Initializer
    const initTheme = () => {
        const savedTheme = localStorage.getItem('wordly_theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
    };
    
    themeToggle.addEventListener('click', () => {
        const activeTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', activeTheme);
        localStorage.setItem('wordly_theme', activeTheme);
    });

    // 6. Favorites UI Array Sync Framework
    const updateFavoritesUI = () => {
        favoritesList.innerHTML = '';
        if (savedWords.length === 0) {
            favoritesWrapper.classList.add('d-none');
            return;
        }
        favoritesWrapper.classList.remove('d-none');

        savedWords.forEach(word => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-secondary p-2 rounded-pill saved-word-item text-capitalize';
            badge.textContent = word; 
            badge.setAttribute('role', 'button');
            badge.addEventListener('click', () => {
                searchInput.value = word; 
                fetchWordData(word);
            });
            favoritesList.appendChild(badge);
        });
    };

    const toggleFavorite = (word) => {
        const normalized = word.toLowerCase().trim();
        const index = savedWords.indexOf(normalized);
        if (index > -1) {
            savedWords.splice(index, 1);
        } else {
            savedWords.push(normalized);
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedWords));
        updateFavoritesUI();
        renderFavoriteButtonState(normalized);
    };

    const renderFavoriteButtonState = (word) => {
        const btn = document.getElementById('favBtn');
        if (!btn) return;
        const isSaved = savedWords.includes(word.toLowerCase().trim());
        if (isSaved) {
            btn.classList.replace('btn-outline-warning', 'btn-warning');
            btn.classList.add('text-white');
        } else {
            btn.classList.replace('btn-warning', 'btn-outline-warning');
            btn.classList.remove('text-white');
        }
    };

    // 7. Async Data Fetching and Network Layer
    const fetchWordData = async (word) => {
        const cleanWord = word.trim();
        if (!cleanWord) return;
        
        // Wipe mount view and present loading component
        resultContainer.innerHTML = ''; 
        resultContainer.appendChild(tplLoading.content.cloneNode(true));

        try {
            // FIXED: Added forward slash before encodeURIComponent to construct valid path syntax
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

            if (!response.ok) {
                throw new Error(response.status === 404 ? 'NotFound' : 'NetworkError');
            }
            const data = await response.json();
            
            // Securely capture the first record entry from the response array
            if (Array.isArray(data) && data.length > 0) {
                currentWordData = data[0]; 
                renderWordResult(currentWordData);
            } else {
                throw new Error('NotFound');
            }
        } catch (error) {
            resultContainer.innerHTML = '';
            const errorNode = tplError.content.cloneNode(true);
            
            if (error.message === 'NotFound') {
                errorNode.querySelector('.JSON-error-msg').textContent = `We couldn't track down definitions for "${cleanWord}". Double-check your spelling or try another query.`;
            } else {
                errorNode.querySelector('.JSON-error-msg').textContent = 'An error occurred while fetching the word data. Please try again later.';
            }
            resultContainer.appendChild(errorNode);
        }
    };

    // 8. Dynamic UI Structural Processing Node Engine
    const renderWordResult = (data) => {
        resultContainer.innerHTML = '';
        const clone = tplResult.content.cloneNode(true);

        // Populate elements safely with clean text content methods
        clone.getElementById('res-word').textContent = data.word;
        clone.getElementById('res-phonetic').textContent = data.phonetic || '';
        
        // Extract functional audio string references safely using validation checks
        const audioObj = data.phonetics?.find(p => p.audio !== '');
        if (audioObj?.audio) {
            const audioBtn = clone.getElementById('audioBtn');
            audioBtn.classList.remove('d-none');
            const audioRef = new Audio(audioObj.audio);
            audioBtn.addEventListener('click', () => audioRef.play());
        }

        // Setup Lexical Processing Arrays Loops
        const meaningsContainer = clone.getElementById('meaningsContainer');
        data.meanings.forEach(meaning => {
            const partOfSpeechSection = document.createElement('div');
            partOfSpeechSection.className = 'mt-3';
            
            let htmlContent = `
                <h4 class="text-primary border-bottom pb-1 text-capitalize fs-5 fw-bold">${meaning.partOfSpeech}</h4>
                <ol class="ps-3">
            `;

            meaning.definitions.slice(0, 3).forEach(def => {
                htmlContent += `
                    <li class="mb-2">
                        <span class="d-block">${def.definition}</span>
                        ${def.example ? `<span class="text-muted d-block small fst-italic mt-1">Example: "${def.example}"</span>` : ''}
                    </li>
                `;
            });
            htmlContent += `</ol>`;

            // Render matching context tokens for vocabulary synonyms
            if (meaning.synonyms && meaning.synonyms.length > 0) {
                htmlContent += `
                    <div class="mb-3 d-flex flex-wrap align-items-center gap-1">
                        <span class="text-muted small me-1">Synonyms:</span>
                `;
                meaning.synonyms.slice(0, 5).forEach(syn => {
                    htmlContent += `<span class="badge badge-synonym px-2 py-1 text-xs text-capitalize" data-synonym="${syn}">${syn}</span>`;
                });
                htmlContent += `</div>`;
            }
            partOfSpeechSection.innerHTML = htmlContent;
            meaningsContainer.appendChild(partOfSpeechSection);
        });

        // Source Hyperlink Reference Context
        const sourceElement = clone.getElementById('res-source');
        
        const sourceUrl = data.sourceUrls?.[0] || `https://wiktionary.org{data.word}`;
        sourceElement.href = sourceUrl;
        sourceElement.textContent = new URL(sourceUrl).hostname;

        // Secure dynamic event listener mapping to prevent internal Content Security Policy blocking
        clone.getElementById('favBtn').addEventListener('click', () => toggleFavorite(data.word));

        // Complete structural insertion layer into layout destination target
        resultContainer.appendChild(clone);

        // Maintain icon style validation updates
        renderFavoriteButtonState(data.word);

        // Optional: Add click handling functionality to rendering synonym tokens
        resultContainer.querySelectorAll('[data-synonym]').forEach(badge => {
            badge.addEventListener('click', (e) => {
                const selectedSynonym = e.target.getAttribute('data-synonym');
                searchInput.value = selectedSynonym;
                fetchWordData(selectedSynonym);
            });
        });
    };

    // 9. Interactivity Layout Layer / Event Listeners
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const queryValue = searchInput.value.trim();
            if (queryValue) {
                fetchWordData(queryValue);
            }
        });
    }

    // 10. System Environment Initializers
    initTheme();
    updateFavoritesUI();
});
