import os
import shutil
import markdown
from jinja2 import Environment, FileSystemLoader
from pathlib import Path
import frontmatter
from datetime import datetime

def generate_site():
    env = Environment(loader=FileSystemLoader("templates"))
    index_template = env.get_template("index.html")
    song_template = env.get_template("song.html")

    # Clean and create site directory
    site_dir = Path("site")
    if site_dir.exists():
        shutil.rmtree(site_dir)
    site_dir.mkdir()

    # Copy static files
    shutil.copytree("static", site_dir/"static")

    # Process songs
    songs = []
    songs_dir = site_dir/"songs"
    songs_dir.mkdir()

    for md_file in Path("content/songs").glob("*.md"):
        post = frontmatter.load(md_file)
        
        # Generate song page
        html_content = markdown.markdown(post.content)
        with open(songs_dir/f"{md_file.stem}.html", "w") as f:
            f.write(song_template.render(
                title=post["title"],
                artist=post["artist"],
                year=post.get("year", datetime.now().year),
                tags=post.get("tags", []),
                content=html_content
            ))

        # Collect data for index
        songs.append({
            "id": md_file.stem,
            "title": post["title"],
            "artist": post["artist"],
            "year": post.get("year", datetime.now().year),
            "tags": post.get("tags", []),
            "path": f"songs/{md_file.stem}.html"
        })

    # Generate index.html
    latest_songs = sorted(songs, key=lambda x: x["year"], reverse=True)[:5]
    all_tags = list(set(tag for song in songs for tag in song["tags"]))

    with open(site_dir/"index.html", "w") as f:
        f.write(index_template.render(
            latest_songs=latest_songs,
            all_tags=sorted(all_tags)
        ))

if __name__ == "__main__":
    generate_site()