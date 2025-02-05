class SearchManager {
    constructor() {
        this.index = lunr.Index.load(SEARCH_DATA.index);
        this.docs = SEARCH_DATA.docs;
        this.currentResults = [];
        this.activeTags = new Set();
    }

    search(query, tags = []) {
        // Basic query expansion
        const expandedQuery = query.split(' ')
            .map(term => `${term}~1`)
            .join(' ');

        // Perform lunr search
        const rawResults = this.index.search(expandedQuery);
        
        // Process results with highlighting
        return rawResults.map(result => {
            const doc = this.docs[result.ref];
            return {
                ...doc,
                highlights: this.highlightMatches(doc, query)
            };
        });
    }

    highlightMatches(doc, query) {
        const highlight = (text, terms) => {
            const regex = new RegExp(`(${terms.join('|')})`, 'gi');
            return text.replace(regex, '<mark>$1</mark>');
        };

        const terms = [...new Set(query.toLowerCase().split(' ').filter(Boolean))];
        
        return {
            title: highlight(doc.title, terms),
            artist: highlight(doc.artist, terms),
            tags: doc.tags.map(tag => highlight(tag, terms)),
            content: highlight(doc.content, terms)
        };
    }

    filterByTags(results, tags) {
        if (tags.size === 0) return results;
        return results.filter(result => 
            tags.size > 0 && 
            result.tags.some(tag => tags.has(tag))
        );
    }

    updateResults(query = '', tags = this.activeTags) {
        const startTime = performance.now();
        
        // Get base results
        const results = query ? this.search(query) : Object.values(this.docs);
        
        // Apply tag filtering
        const filtered = this.filterByTags(results, tags);
        
        // Sort by year descending
        const sorted = filtered.sort((a, b) => b.year - a.year);
        
        // Update display
        this.displayResults(sorted);
        
        // Show performance stats
        const duration = performance.now() - startTime;
        document.getElementById('searchStats').textContent = 
            `Found ${sorted.length} results in ${duration.toFixed(1)}ms`;
    }

    displayResults(results) {
        const resultsHTML = results.slice(0, 100).map(result => `
            <article class="song-result">
                <h3>
                    <a href="${result.path}">${result.highlights.title}</a>
                    <small>${result.highlights.artist}</small>
                </h3>
                <div class="meta">
                    <span class="year">${result.year}</span>
                    <div class="tags">
                        ${result.highlights.tags.map(t => `
                            <span class="tag" data-tag="${t}">${t}</span>
                        `).join('')}
                    </div>
                </div>
                <div class="preview">${result.highlights.content}</div>
            </article>
        `).join('');

        document.getElementById('searchResults').innerHTML = resultsHTML || 
            `<div class="no-results">No matching songs found</div>`;
    }
}

// Initialize search manager
document.addEventListener('DOMContentLoaded', () => {
    const searchManager = new SearchManager();
    const searchInput = document.getElementById('searchInput');
    
    // Real-time search
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchManager.updateResults(e.target.value.trim());
        }, 50);
    });
    
    // Tag click handler
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
            const tag = e.target.dataset.tag;
            searchManager.activeTags.has(tag) 
                ? searchManager.activeTags.delete(tag)
                : searchManager.activeTags.add(tag);
            searchManager.updateResults(searchInput.value.trim());
        }
    });
    
    // Initial load
    searchManager.updateResults();
});