import os
import sys
from flask import Flask, render_template, request, url_for, redirect

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24).hex()

@app.route("/")
def home():
    return(render_template("index.html"))

@app.route("/imgoatex", defaults={"path": ""})
@app.route("/imgoatex/<path:path>")
def redirect_to_imgoatex(path):
    return redirect(f"https://imgoatex.arnaudlelievre.fr/{path}", code=302)

if __name__ == "__main__":
    app.run(debug=True)
