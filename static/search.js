class SearchEngine {
    constructor() {
      this.searchIndex = [];
      this.tagIndex = new Map();
      this.worker = new Worker('/static/search-worker.js');
    }
  
    async init() {
      const [songs, tags] = await Promise.all([
        fetch('/search/index.json').then(r => r.json()),
        fetch('/search/tags.json').then(r => r.json())
      ]);
      
      this.searchIndex = songs;
      this.tagIndex = new Map(Object.entries(tags));
      
      this.worker.postMessage({
        type: 'INIT',
        payload: { songs, tags }
      });
    }
  
    search(query, tags = []) {
      return new Promise((resolve) => {
        this.worker.onmessage = (e) => resolve(e.data);
        this.worker.postMessage({
          type: 'SEARCH',
          payload: { query: query.toLowerCase(), tags }
        });
      });
    }
  }
  
  // Web Worker (search-worker.js)
  self.onmessage = function(e) {
    const { type, payload } = e.data;
    
    if (type === 'INIT') {
      self.searchIndex = payload.songs;
      self.tagIndex = payload.tags;
    }
    
    if (type === 'SEARCH') {
      const results = [];
      const queryWords = payload.query.split(/\s+/);
      const tagIds = payload.tags.flatMap(t => self.tagIndex[t] || []);
      
      const scoreSong = (song) => {
        let score = 0;
        
        // Tag matching
        if (payload.tags.length > 0) {
          const songTags = new Set(song.tags);
          score += payload.tags.filter(t => songTags.has(t)).length * 10;
        }
        
        // Text matching
        const content = `${song.title} ${song.artist} ${song.content}`.toLowerCase();
        score += queryWords.filter(word => content.includes(word)).length * 2;
        
        return score;
      };
      
      const scored = self.searchIndex.map(song => ({
        ...song,
        score: scoreSong(song)
      }));
      
      const filtered = scored.filter(s => s.score > 0)
                             .sort((a, b) => b.score - a.score)
                             .slice(0, 100);
      
      self.postMessage(filtered);
    }
  };