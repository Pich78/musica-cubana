import os
import shutil
import markdown
from jinja2 import Environment, FileSystemLoader
from pathlib import Path
import frontmatter

def generate_site():
    env = Environment(loader=FileSystemLoader("templates"))
    template = env.get_template("song.html")
    
    # Clean and create site directory
    site_dir = Path("site")
    if site_dir.exists():
        shutil.rmtree(site_dir)
    site_dir.mkdir()
    
    # Copy static files
    shutil.copytree("static", site_dir/"static")
    
    # Process songs
    songs_dir = site_dir/"songs"
    songs_dir.mkdir()
    
    for md_file in Path("content/songs").glob("*.md"):
        post = frontmatter.load(md_file)
        html_content = markdown.markdown(post.content)
        
        with open(songs_dir/f"{md_file.stem}.html", "w") as f:
            f.write(template.render(
                title=post["title"],
                artist=post["artist"],
                year=post["year"],
                tags=post["tags"],
                content=html_content
            ))

if __name__ == "__main__":
    generate_site()