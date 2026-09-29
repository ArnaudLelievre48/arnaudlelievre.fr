import os
import sys
from pathlib import Path
from flask import Flask, abort, redirect, render_template, request, send_from_directory

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

def animation_demos():
    """Return the demo folders and their first HTML entry point."""
    demos_directory = Path(app.root_path) / app.template_folder / "demo-temp"
    return {
        directory.name: next(iter(sorted(directory.glob("*.html"))), None)
        for directory in sorted(demos_directory.glob("animation-solution-*"))
        if directory.is_dir()
    }


@app.route("/demo-temp")
def demo_temp():
    demos = animation_demos()
    selected_demo = request.args.get("animation")
    if selected_demo not in demos:
        selected_demo = next(iter(demos), None)

    selected_entry = demos.get(selected_demo)
    return render_template(
        "demo-temp.html",
        demos=demos,
        selected_demo=selected_demo,
        selected_entry=selected_entry,
    )


@app.route("/demo-temp/<animation_name>/<path:filename>")
def demo_temp_file(animation_name, filename):
    demos = animation_demos()
    if animation_name not in demos:
        abort(404)

    directory = Path(app.root_path) / app.template_folder / "demo-temp" / animation_name
    return send_from_directory(directory, filename)



@app.route("/imgoatex", defaults={"path": ""})
@app.route("/imgoatex/<path:path>")
def redirect_to_imgoatex(path):
    return redirect(f"https://imgoatex.arnaudlelievre.fr/{path}", code=302)

if __name__ == "__main__":
    app.run(debug=True)
