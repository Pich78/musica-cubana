import os
import json
import markdown
from jinja2 import Environment, FileSystemLoader
from pathlib import Path
import frontmatter
from dataclasses import dataclass

@dataclass
class Song:
    id: str
    path: str
    title: str
    artist: str
    year: int
    tags: list
    content_html: str
    audio: str

def build_site():
    # Setup
    env = Environment(loader=FileSystemLoader("templates"))
    song_template = env.get_template("song.html")
    search_index = []
    tag_index = {}

    # Process songs
    for md_file in Path("content/songs").glob("*.md"):
        # Parse markdown
        post = frontmatter.load(md_file)
        
        # Create song object
        song = Song(
            id=md_file.stem,
            path=f"/songs/{md_file.stem}.html",
            title=post["title"],
            artist=post["artist"],
            year=post["year"],
            tags=post["tags"],
            content_html=markdown.markdown(post.content),
            audio=post.get("audio", "")
        )

        # Generate HTML file
        output_path = Path("build") / "songs" / f"{song.id}.html"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w") as f:
            f.write(song_template.render(song=song))

        # Update search indices
        search_entry = {
            "id": song.id,
            "title": song.title,
            "artist": song.artist,
            "year": song.year,
            "tags": song.tags,
            "content": post.content.lower(),
            "path": song.path
        }
        search_index.append(search_entry)

        # Update tag index
        for tag in song.tags:
            tag_index.setdefault(tag, []).append(song.id)

    # Save search indices
    search_dir = Path("build/search")
    search_dir.mkdir(parents=True, exist_ok=True)
    
    with open(search_dir / "index.json", "w") as f:
        json.dump(search_index, f)
    
    with open(search_dir / "tags.json", "w") as f:
        json.dump(tag_index, f)

if __name__ == "__main__":
    build_site()