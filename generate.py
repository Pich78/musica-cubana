# Add to imports
from lunr import lunr

# Modify the index generation part
def generate_site():
    # ... existing code ...

    # Create search index
    search_index = lunr(
        ref='id',
        fields=[('title', 2), ('artist', 1), ('tags', 1), ('content', 1)],
        documents=[
            {
                'id': song["id"],
                'title': song["title"],
                'artist': song["artist"],
                'tags': ' '.join(song["tags"]),
                'content': ' '.join(markdown.markdown(post.content).split()[:100])  # First 100 words
            }
            for song in songs
        ]
    )

    # Serialize index
    search_data = {
        "index": search_index.serialize(),
        "docs": {song["id"]: song for song in songs}
    }

    # Generate index.html
    with open(site_dir/"index.html", "w") as f:
        f.write(index_template.render(
            latest_songs=latest_songs,
            all_tags=sorted(all_tags),
            search_data=search_data
        ))