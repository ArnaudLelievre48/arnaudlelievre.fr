import os
import sys
from pathlib import Path
from flask import Flask, render_template, request, url_for, redirect

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24).hex()

@app.route("/")
def home():
    projects_directory = Path(app.root_path) / app.template_folder / "projects"
    project_templates = [
        f"projects/{path.name}"
        for path in sorted(projects_directory.glob("*.html"))
    ]
    return render_template(
        "index.html",
        project_templates=project_templates,
    )

@app.route("/blackhole-tour")
def blackhole_tour():
    return render_template("blackhole-tour.html")

@app.route("/imgoatex", defaults={"path": ""})
@app.route("/imgoatex/<path:path>")
def redirect_to_imgoatex(path):
    return redirect(f"https://imgoatex.arnaudlelievre.fr/{path}", code=302)

if __name__ == "__main__":
    app.run(debug=True)
